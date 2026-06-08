import 'vuetify/styles'
import {
  mdiAccountCircle,
  mdiExport,
  mdiEye,
  mdiImport,
  mdiRestore,
} from '@mdi/js'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      accountCircle: `svg:${mdiAccountCircle}`,
      export: `svg:${mdiExport}`,
      eye: `svg:${mdiEye}`,
      import: `svg:${mdiImport}`,
      restore: `svg:${mdiRestore}`,
    },
    sets: {
      mdi,
    },
  },
})
