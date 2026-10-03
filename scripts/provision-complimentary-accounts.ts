import { ComplimentaryAccessService } from '../src/lib/billing/complimentaryAccessService';

async function main() {
  console.log('================================================================');
  console.log('INGRESS WITHIN: PROVISION PERMANENT COMPLIMENTARY ENTITLEMENTS');
  console.log('================================================================\n');

  const targetPhones = [
    '+918805046256',
    '+917058794101',
    '+918955605569'
  ];

  console.log('Target phone numbers:', targetPhones);
  console.log('Executing safe, idempotent provisioning...\n');

  const results = await ComplimentaryAccessService.provisionAccountsByPhone(
    targetPhones,
    'system_admin',
    'permanent complimentary access'
  );

  console.log('--- PROVISIONING RESULTS ---');
  for (const r of results) {
    console.log(`\nPhone: ${r.phone}`);
    console.log(`  Normalized Phone: ${r.normalizedPhone}`);
    console.log(`  User ID:          ${r.userId}`);
    console.log(`  User Role:        ${r.role}`);
    console.log(`  Status:           ${r.status}`);
    if (r.entitlement) {
      console.log(`  Entitlement ID:   ${r.entitlement.id}`);
      console.log(`  Source:           ${r.entitlement.source}`);
      console.log(`  Reason:           ${r.entitlement.reason}`);
      console.log(`  Expires At:       ${r.entitlement.expiresAt} (NULL = Permanent)`);
      console.log(`  Subscription ID:  ${r.entitlement.subscriptionId}`);
      console.log(`  Gateway Sub ID:   ${r.entitlement.gatewaySubscriptionId}`);
    }
    if (r.error) {
      console.log(`  Error:            ${r.error}`);
    }
  }

  console.log('\n================================================================');
  console.log('PROVISIONING COMPLETE');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Fatal error during provisioning:', err);
  process.exit(1);
});
