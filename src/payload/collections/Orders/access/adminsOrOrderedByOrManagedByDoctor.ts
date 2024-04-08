import type { Access } from 'payload/config'

import { checkRole } from '../../Users/checkRole'

export const adminsOrOrderedByOrManagedByDoctor: Access = async ({ req: { user, payload } }) => {
  if (checkRole(['admin'], user)) {
    return true
  }

  if (checkRole(['doctor'], user)) {
    const clinics = await payload.find({
      collection: 'clinics',
      where: { doctors: user?.id },
    })

    const patients = clinics.docs.flatMap(clinic =>
      clinic.patients.flatMap(patient => (typeof patient === 'string' ? patient : patient.id)),
    )

    return {
      orderedBy: {
        or: {
          in: patients,
          equals: user?.id,
        },
      },
    }
  }

  return {
    orderedBy: {
      equals: user?.id,
    },
  }
}
