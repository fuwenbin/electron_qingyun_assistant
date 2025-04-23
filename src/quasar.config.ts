import { configure } from 'quasar/wrappers';

export default configure((/* ctx */) => {
  return {
    supportTS: true,
    electron: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    extras: [
      'roboto-font',
      'material-icons',
    ],
    framework: {
      config: {
        brand: {
          primary: '#1976D2',
          secondary: '#26A69A',
          accent: '#9C27B0',
          dark: '#1d1d1d',
          positive: '#21BA45',
          negative: '#C10015',
          info: '#31CCEC',
          warning: '#F2C037'
        }
      }
    }
  }
}); 