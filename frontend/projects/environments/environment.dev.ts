let host = window.location.protocol + '//' + window.location.hostname

export const environment = {
  production: false,
  CAPTCHA_SECRET_KEY: '03f26e402586fkisanf2395fsg9632faa8da4c98a35f1b20d6b033c50',
  PASSWORD_SECRET_KEY: '08t16e502526fesanfjh8nasd2',
  sharedSecret: 'tg:D/|oP$:s2I[-8-Pc:|8/U7+?!r]g#',
  // API
  commonApiUrl: `${host}:3100/commonApi24`,
  fetchApiUrl: `${host}:3101/fetchApi24`,
  deptApiUrl: `${host}:3103/deptApi`,
  otherApiUrl: `${host}:3102/otherApi24`,
  farmerApiUrl: `${host}/farmerApi24`,
 // deptApiUrl: `${host}:3104/deptApi24`,

  // Module
  login: `${host}:5200`,
  admin: `${host}:5300`,
  office_admin: `${host}:5300`,
  department_admin: `${host}:5400`,
  printCSS: `${host}:3100/commonApi24/printcss.css`
};
