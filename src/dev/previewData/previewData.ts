import type { AppStore } from '@/app/store';

type PreviewDataSeeder = (store: AppStore) => Promise<void>;

/** Explicit composition root for opt-in development data profiles. */
const previewDataSeeders = {
  customers: async (store) => {
    const { seedCustomerPreviewData } = await import('@/dev/previewData/customers.preview');
    seedCustomerPreviewData(store);
  },
} satisfies Record<string, PreviewDataSeeder>;

type PreviewDataProfile = keyof typeof previewDataSeeders;

function isPreviewDataProfile(profile: string): profile is PreviewDataProfile {
  return Object.hasOwn(previewDataSeeders, profile);
}

export async function seedPreviewData(store: AppStore, profile: string): Promise<void> {
  if (!isPreviewDataProfile(profile)) {
    throw new Error(
      `Unknown preview data profile "${profile}". Available profiles: ${Object.keys(previewDataSeeders).join(', ')}`,
    );
  }

  await previewDataSeeders[profile](store);
}
