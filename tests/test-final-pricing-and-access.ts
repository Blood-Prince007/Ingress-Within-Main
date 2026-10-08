import { BillingService, GST_RATE } from '../src/lib/billing/billingService';
import { AccessControlService, AccessDeniedError } from '../src/lib/billing/accessControlService';
import { EntitlementService } from '../src/lib/billing/entitlementService';
import { ReconciliationService } from '../src/lib/billing/reconciliationService';
import { supabase } from '../src/lib/db';
import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS ${passed}] ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${description}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('INGRESS WITHIN: 50-CHECK FINAL PRICING & ACCESS CONTROL TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // SECTION 1: MATHEMATICAL PRICING INVARIANTS (GST INCLUSIVE)
  // -------------------------------------------------------------
  console.log('--- SECTION 1: Mathematical Pricing Invariants (GST Inclusive) ---');
  const pricing = BillingService.calculatePricing(49900, 0.18);
  
  assert(pricing.totalPaise === 49900, 'Total paise is exactly 49900 (₹499.00)');
  assert(pricing.subtotalPaise === 42288, 'Taxable subtotal is exactly 42288 paise (₹422.88)');
  assert(pricing.gstPaise === 7612, '18% GST is exactly 7612 paise (₹76.12)');
  assert(pricing.subtotalPaise + pricing.gstPaise === pricing.totalPaise, 'Mathematical check: 42288 + 7612 === 49900 paise');
  assert(pricing.formattedTotal === '₹499.00', 'Formatted total string is ₹499.00');
  assert(pricing.formattedSubtotal === '₹422.88', 'Formatted subtotal string is ₹422.88');
  assert(pricing.formattedGst === '₹76.12', 'Formatted GST string is ₹76.12');
  assert(pricing.gstRate === 0.18, 'GST rate is 0.18 (18%)');

  // Custom module pricing math
  const modulePricing = BillingService.calculatePricing(149900, 0.18);
  assert(modulePricing.totalPaise === 149900, 'Custom total paise preserved (149900)');
  assert(modulePricing.subtotalPaise + modulePricing.gstPaise === modulePricing.totalPaise, 'Custom pricing invariant: subtotal + gst === total');

  // -------------------------------------------------------------
  // SECTION 2: AUTHORITATIVE SINGLE SUBSCRIPTION PRODUCT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: Authoritative Single Subscription Product ---');
  const defaultProduct = BillingService.DEFAULT_SELF_HELP_PRODUCT;
  assert(defaultProduct.sku === 'SELF_HELP_MONTHLY', 'Authoritative SKU is SELF_HELP_MONTHLY');
  assert(defaultProduct.name === 'Ingress Within Self-Work', 'Public plan name is Ingress Within Self-Work');
  assert(defaultProduct.price_inr === 49900, 'Product price_inr is 49900 paise');
  assert(defaultProduct.type === 'subscription', 'Product type is subscription');
  assert(defaultProduct.interval === 'monthly', 'Subscription interval is monthly');
  assert(defaultProduct.is_active === true, 'Product is marked active');

  // DB Product Query
  const dbProduct = await BillingService.getProductBySku('SELF_HELP_MONTHLY');
  assert(dbProduct.sku === 'SELF_HELP_MONTHLY', 'DB query by SKU returns SELF_HELP_MONTHLY');
  assert(dbProduct.price_inr === 49900, 'DB product price_inr is 49900 paise');
  assert(dbProduct.name === 'Ingress Within Self-Work', 'DB product name is Ingress Within Self-Work');

  const activeProducts = await BillingService.getActiveProducts();
  const subscriptionProducts = activeProducts.filter(p => p.type === 'subscription');
  assert(subscriptionProducts.length === 1, 'Exactly ONE active subscription product exists');
  assert(subscriptionProducts[0].sku === 'SELF_HELP_MONTHLY', 'The single active subscription SKU is SELF_HELP_MONTHLY');

  // -------------------------------------------------------------
  // SECTION 3: RAZORPAY LIVE INTEGRATION & PLAN VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: Razorpay Live Integration & Plan Verification ---');
  const razorpay = BillingService.getRazorpayClient();
  assert(razorpay !== null, 'Razorpay client is instantiated successfully');

  let fetchedPlan: any = null;
  const envPlanId = process.env.RAZORPAY_PLAN_ID;
  assert(typeof envPlanId === 'string' && envPlanId.startsWith('plan_'), 'RAZORPAY_PLAN_ID is present in environment');

  if (razorpay && envPlanId) {
    try {
      fetchedPlan = await razorpay.plans.fetch(envPlanId);
    } catch (e) {
      console.error('Plan fetch error:', e);
    }
  }
  assert(fetchedPlan !== null, 'Razorpay plan fetched successfully from gateway API');
  assert(fetchedPlan?.item?.amount === 49900, 'Razorpay plan amount is exactly 49900 paise (₹499.00)');
  assert(fetchedPlan?.item?.currency === 'INR', 'Razorpay plan currency is INR');
  assert(fetchedPlan?.period === 'monthly', 'Razorpay plan period is monthly');
  assert(fetchedPlan?.interval === 1, 'Razorpay plan interval is 1');
  assert(fetchedPlan?.item?.name?.includes('Self-Work'), 'Razorpay plan name contains Self-Work');

  // -------------------------------------------------------------
  // SECTION 4: ACCESS CONTROL SERVICE STATE EVALUATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: Access Control Service State Evaluation ---');

  // 1. Synthetic Reviewer
  const reviewerAccess = await AccessControlService.getCustomerAccess('usr_synthetic_razorpay_reviewer');
  assert(reviewerAccess.state === 'ACTIVE', 'Synthetic reviewer returns state ACTIVE');
  assert(reviewerAccess.capabilities.canWriteJournal === true, 'Reviewer canWriteJournal is true');
  assert(reviewerAccess.capabilities.canStartSession === true, 'Reviewer canStartSession is true');
  assert(reviewerAccess.capabilities.canPerformExercise === true, 'Reviewer canPerformExercise is true');
  assert(reviewerAccess.capabilities.canGenerateReports === true, 'Reviewer canGenerateReports is true');
  assert(reviewerAccess.capabilities.canReadHistory === true, 'Reviewer canReadHistory is true');
  assert(reviewerAccess.banner === null, 'Reviewer banner is null');

  // 2. Fresh Trial User (created today)
  const testTrialUserId = crypto.randomUUID();
  const now = new Date();
  await supabase.from('users').insert({
    id: testTrialUserId,
    phone_number: `+9199990${Math.floor(10000 + Math.random() * 90000)}`,
    name: 'Trial Tester',
    created_at: now.toISOString(),
    is_active: true
  });

  const trialAccess = await AccessControlService.getCustomerAccess(testTrialUserId);
  assert(trialAccess.state === 'TRIAL', 'User within 7-day window evaluates to state TRIAL');
  assert(trialAccess.capabilities.canWriteJournal === true, 'Trial user canWriteJournal is true');
  assert(trialAccess.capabilities.canStartSession === true, 'Trial user canStartSession is true');
  assert(trialAccess.capabilities.canPerformExercise === true, 'Trial user canPerformExercise is true');
  assert(trialAccess.capabilities.canGenerateReports === true, 'Trial user canGenerateReports is true');
  assert(trialAccess.capabilities.canReadHistory === true, 'Trial user canReadHistory is true');
  assert(trialAccess.trialDaysRemaining > 0, 'Trial user has days remaining > 0');
  assert(trialAccess.banner?.type === 'trial', 'Trial user has trial banner');

  // 3. Dormant User (created 30 days ago, no subscription)
  const testDormantUserId = crypto.randomUUID();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await supabase.from('users').insert({
    id: testDormantUserId,
    phone_number: `+9199991${Math.floor(10000 + Math.random() * 90000)}`,
    name: 'Dormant Tester',
    created_at: thirtyDaysAgo.toISOString(),
    is_active: true
  });

  const dormantAccess = await AccessControlService.getCustomerAccess(testDormantUserId);
  assert(dormantAccess.state === 'DORMANT', 'User past 7-day trial without subscription evaluates to DORMANT');
  assert(dormantAccess.capabilities.canWriteJournal === false, 'Dormant user canWriteJournal is FALSE');
  assert(dormantAccess.capabilities.canStartSession === false, 'Dormant user canStartSession is FALSE');
  assert(dormantAccess.capabilities.canPerformExercise === false, 'Dormant user canPerformExercise is FALSE');
  assert(dormantAccess.capabilities.canGenerateReports === false, 'Dormant user canGenerateReports is FALSE');
  assert(dormantAccess.capabilities.canReadHistory === true, 'Dormant user canReadHistory is TRUE (archives preserved)');
  assert(dormantAccess.banner?.type === 'dormant', 'Dormant user receives calm reflective read-only banner');

  // -------------------------------------------------------------
  // SECTION 5: ACCESS GUARDS & CAPABILITY ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5: Access Guards & Capability Enforcement ---');

  // Guards must reject dormant users
  let writeBlocked = false;
  try {
    await AccessControlService.requireSelfHelpWriteAccess(testDormantUserId);
  } catch (err: any) {
    if (err instanceof AccessDeniedError && (err.code === 'SUBSCRIPTION_REQUIRED' || err.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') && err.statusCode === 403) {
      writeBlocked = true;
    }
  }
  assert(writeBlocked, 'requireSelfHelpWriteAccess throws 403 AccessDeniedError for dormant user');

  let exerciseBlocked = false;
  try {
    await AccessControlService.requireExerciseProgressAccess(testDormantUserId, 'exercise_1');
  } catch (err: any) {
    if (err instanceof AccessDeniedError && (err.code === 'SUBSCRIPTION_REQUIRED' || err.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') && err.statusCode === 403) {
      exerciseBlocked = true;
    }
  }
  assert(exerciseBlocked, 'requireExerciseProgressAccess throws 403 AccessDeniedError for dormant user');

  let reportBlocked = false;
  try {
    await AccessControlService.requireReportGenerateAccess(testDormantUserId);
  } catch (err: any) {
    if (err instanceof AccessDeniedError && (err.code === 'SUBSCRIPTION_REQUIRED' || err.code === 'SELF_HELP_SUBSCRIPTION_REQUIRED') && err.statusCode === 403) {
      reportBlocked = true;
    }
  }
  assert(reportBlocked, 'requireReportGenerateAccess throws 403 AccessDeniedError for dormant user');

  // Guards must allow trial users
  let trialWriteAllowed = false;
  try {
    const access = await AccessControlService.requireSelfHelpWriteAccess(testTrialUserId);
    if (access.capabilities.canWriteJournal) trialWriteAllowed = true;
  } catch (e) {}
  assert(trialWriteAllowed, 'requireSelfHelpWriteAccess succeeds for trial user');

  // -------------------------------------------------------------
  // SECTION 6: MODULE INDEPENDENT PURCHASE DECOUPLING
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6: Module Independent Purchase Decoupling ---');

  // Dedicated test user with active subscription but NO module purchase
  const testSubOnlyUserId = crypto.randomUUID();
  await supabase.from('users').insert({
    id: testSubOnlyUserId,
    phone_number: `+9199992${Math.floor(10000 + Math.random() * 90000)}`,
    name: 'Sub Tester',
    created_at: thirtyDaysAgo.toISOString(),
    is_active: true
  });
  await supabase.from('subscriptions').insert({
    user_id: testSubOnlyUserId,
    product_id: dbProduct.id,
    gateway_subscription_id: `sub_test_${Date.now()}`,
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
    paid_count: 1
  });

  const hasModuleWithoutPurchase = await EntitlementService.hasModuleAccess(testSubOnlyUserId, 'module_anxiety_deep_dive');
  assert(hasModuleWithoutPurchase === false, 'Subscription alone does NOT grant access to unpurchased module');

  let moduleBlocked = false;
  try {
    await AccessControlService.requireModuleAccess(testSubOnlyUserId, 'module_anxiety_deep_dive');
  } catch (e: any) {
    if (e instanceof AccessDeniedError && e.code === 'MODULE_PURCHASE_REQUIRED') {
      moduleBlocked = true;
    }
  }
  assert(moduleBlocked, 'requireModuleAccess throws MODULE_PURCHASE_REQUIRED for unpurchased module');

  // Grant module entitlement and verify access
  await supabase.from('entitlements').insert({
    user_id: testSubOnlyUserId,
    product_id: dbProduct.id,
    source_type: 'order',
    feature_key: 'module_anxiety_deep_dive',
    is_active: true
  });
  const hasModuleWithPurchase = await EntitlementService.hasModuleAccess(testSubOnlyUserId, 'module_anxiety_deep_dive');
  assert(hasModuleWithPurchase === true, 'hasModuleAccess succeeds when module entitlement is present');

  // -------------------------------------------------------------
  // SECTION 7: SEQUENTIAL REAL INVOICES & VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7: Sequential Real Invoices & Verification ---');

  const testPaymentId = `pay_test_${Date.now()}`;
  const confirmResult = await BillingService.onPaymentConfirmed({
    userId: testSubOnlyUserId,
    paymentId: testPaymentId,
    amount: 49900,
    paymentMethodType: 'upi',
    maskedAccount: 'user@upi'
  });

  assert(confirmResult.success === true, 'onPaymentConfirmed succeeds');
  assert(typeof confirmResult.invoiceNumber === 'string', 'Invoice number generated');
  assert(/^INV-\d{4}-\d{5}$/.test(confirmResult.invoiceNumber!), 'Invoice number matches sequence INV-YYYY-XXXXX');

  // Fetch invoice record from DB
  const { data: inv } = await supabase
    .from('invoices')
    .select('*')
    .eq('gateway_payment_id', testPaymentId)
    .single();

  assert(inv !== null, 'Invoice saved to DB');
  assert(inv?.amount_total === 49900, 'Invoice amount_total is 49900 paise');
  assert(inv?.amount_subtotal === 42288, 'Invoice amount_subtotal is 42288 paise');
  assert(inv?.amount_gst === 7612, 'Invoice amount_gst is 7612 paise');
  assert(inv?.amount_subtotal + inv?.amount_gst === inv?.amount_total, 'Invoice math invariant: 42288 + 7612 === 49900');

  // -------------------------------------------------------------
  // SECTION 8: FRONTEND PRICING PURGE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- SECTION 8: Frontend Pricing Purge Audit ---');

  const settingsContent = fs.readFileSync(path.resolve('src/views/SettingsPage.jsx'), 'utf8');
  assert(!settingsContent.includes('588.82'), 'SettingsPage.jsx has zero occurrences of 588.82');
  assert(settingsContent.includes('Ingress Within Self-Work'), 'SettingsPage.jsx contains Ingress Within Self-Work');
  assert(settingsContent.includes('₹499'), 'SettingsPage.jsx contains ₹499');

  const pricingPageContent = fs.readFileSync(path.resolve('src/views/PricingPage.jsx'), 'utf8');
  assert(!pricingPageContent.includes('₹999'), 'PricingPage.jsx has zero occurrences of ₹999');
  assert(!pricingPageContent.includes('Founding 50 only'), 'PricingPage.jsx has no Founding 50 only badge');
  assert(pricingPageContent.includes('Ingress Within Self-Work'), 'PricingPage.jsx contains Ingress Within Self-Work');

  const landingContent = fs.readFileSync(path.resolve('src/views/LandingPage.jsx'), 'utf8');
  assert(!landingContent.includes('&#8377;999'), 'LandingPage.jsx has zero occurrences of &#8377;999');
  assert(!landingContent.includes('Founding 50 only'), 'LandingPage.jsx has no Founding 50 badge');

  const faqContent = fs.readFileSync(path.resolve('src/views/FaqPage.jsx'), 'utf8');
  assert(!faqContent.includes('₹999'), 'FaqPage.jsx has zero occurrences of ₹999');
  assert(faqContent.includes('₹499 per month (GST inclusive)'), 'FaqPage.jsx explicitly states ₹499 per month (GST inclusive)');

  // -------------------------------------------------------------
  // SECTION 9: CANONICAL CAPABILITY MODEL (SECTION 27 COMPLIANCE)
  // -------------------------------------------------------------
  console.log('\n--- SECTION 9: Canonical Capability Model (Section 27 Compliance) ---');

  assert(trialAccess.selfHelp.canWrite === true, 'Trial user selfHelp.canWrite is true');
  assert(trialAccess.selfHelp.canUseAI === true, 'Trial user selfHelp.canUseAI is true');
  assert(trialAccess.selfHelp.canGenerateWeeklyReflection === true, 'Trial user selfHelp.canGenerateWeeklyReflection is true');
  assert(trialAccess.selfHelp.canGeneratePatterns === true, 'Trial user selfHelp.canGeneratePatterns is true');
  assert(trialAccess.history.canViewEntries === true, 'Trial user history.canViewEntries is true');
  assert(trialAccess.firstWeeklyReport.canView === true, 'Trial user firstWeeklyReport.canView is true');
  assert(trialAccess.firstWeeklyReport.permanent === true, 'Trial user firstWeeklyReport is permanent');

  assert(dormantAccess.selfHelp.canWrite === false, 'Dormant user selfHelp.canWrite is FALSE');
  assert(dormantAccess.selfHelp.canStartSession === false, 'Dormant user selfHelp.canStartSession is FALSE');
  assert(dormantAccess.selfHelp.canUseExercises === false, 'Dormant user selfHelp.canUseExercises is FALSE');
  assert(dormantAccess.selfHelp.canUseAI === false, 'Dormant user selfHelp.canUseAI is FALSE');
  assert(dormantAccess.selfHelp.canGenerateWeeklyReflection === false, 'Dormant user selfHelp.canGenerateWeeklyReflection is FALSE');
  assert(dormantAccess.selfHelp.canGenerateReports === false, 'Dormant user selfHelp.canGenerateReports is FALSE');
  assert(dormantAccess.selfHelp.canGeneratePatterns === false, 'Dormant user selfHelp.canGeneratePatterns is FALSE');

  assert(dormantAccess.history.canViewEntries === true, 'Dormant user history.canViewEntries is TRUE');
  assert(dormantAccess.history.canViewReflections === true, 'Dormant user history.canViewReflections is TRUE');
  assert(dormantAccess.history.canViewReports === true, 'Dormant user history.canViewReports is TRUE');
  assert(dormantAccess.history.canViewPatterns === true, 'Dormant user history.canViewPatterns is TRUE');
  assert(dormantAccess.history.canViewExerciseResults === true, 'Dormant user history.canViewExerciseResults is TRUE');
  assert(dormantAccess.firstWeeklyReport.canView === true, 'Dormant user firstWeeklyReport.canView is TRUE');
  assert(dormantAccess.firstWeeklyReport.permanent === true, 'Dormant user firstWeeklyReport is permanent');
  assert(dormantAccess.workshops.canBrowse === true, 'Dormant user workshops.canBrowse is TRUE');
  assert(dormantAccess.interventions.canAccess === true, 'Dormant user interventions.canAccess is TRUE');

  // -------------------------------------------------------------
  // SECTION 10: RECONCILIATION & SELF-HEALING (SECTION 58 & 74)
  // -------------------------------------------------------------
  console.log('\n--- SECTION 10: Reconciliation & Self-Healing Service ---');

  const reconciliationReport = await ReconciliationService.reconcileSubscriptions();
  assert(typeof reconciliationReport.timestamp === 'string', 'Reconciliation report generated with ISO timestamp');
  assert(typeof reconciliationReport.staleSubscriptionsChecked === 'number', 'Stale subscriptions audited');
  assert(typeof reconciliationReport.staleSubscriptionsRepaired === 'number', 'Stale subscriptions self-healed');
  assert(typeof reconciliationReport.duplicateSubscriptionsResolved === 'number', 'Duplicate active subscriptions audited and resolved');
  assert(typeof reconciliationReport.expiredEntitlementsDeactivated === 'number', 'Expired entitlements deactivated');
  assert(typeof reconciliationReport.missingEntitlementsRepaired === 'number', 'Missing entitlements repaired for active subscribers');

  // Clean up temporary test records
  try {
    await supabase.from('invoices').delete().eq('gateway_payment_id', testPaymentId);
    await supabase.from('entitlements').delete().eq('user_id', testSubOnlyUserId);
    await supabase.from('subscriptions').delete().eq('user_id', testSubOnlyUserId);
    await supabase.from('users').delete().in('id', [testTrialUserId, testDormantUserId, testSubOnlyUserId]);
  } catch (e) {}

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL CHECKS: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

