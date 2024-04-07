import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.update({
    collection: 'users',
    where: {},
    data: {
      wishlist: {
        items: [],
      },
    },
  })
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.collections.users.updateMany({}, { $unset: { wishlist: '' } })
}
