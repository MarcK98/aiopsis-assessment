import type { Payload } from 'payload'

import { checkRole } from '../../Users/checkRole'

// ensure the first user created is an admin
// 1. lookup a single user on create as succinctly as possible
// 2. if there are no users found, append `admin` to the roles array
// access control is already handled by this fields `access` property
// it ensures that only admins can create and update the `roles` field
export const ensureUsersHaveRole =
  (role: 'admin' | 'doctor' | 'patient') =>
  async (users, { operation, payload }) => {
    if (users && payload) {
      if (operation === 'create' || operation === 'update') {
        for (const id of users) {
          const user = await (payload as Payload).findByID({ collection: 'users', id })
          if (!checkRole([role], user)) {
            return `some users are not ${role}s`
          }
        }
        return true
      }
    }
    return true
  }
