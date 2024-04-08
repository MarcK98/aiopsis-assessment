import type { CollectionConfig } from 'payload/types'

import { admins } from '../../access/admins'
import { checkRole } from '../Users/checkRole'
import { ensureUsersHaveRole } from './hooks/ensureUsersHaveRole'

export const Clinics: CollectionConfig = {
  slug: 'clinics',
  access: {
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'doctors',
      label: 'Doctors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      validate: ensureUsersHaveRole('doctor'),
    },
    {
      name: 'patients',
      label: 'Patients',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      validate: ensureUsersHaveRole('patient'),
    },
  ],
}
