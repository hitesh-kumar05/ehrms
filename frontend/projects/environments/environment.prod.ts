let host = window.location.protocol + '//kisan.cg.nic.in'
export const environment = {
  production: true,
  CAPTCHA_SECRET_KEY: '03f26e402586fkisanf2395fsg9632faa8da4c98a35f1b20d6b033c50',
  PASSWORD_SECRET_KEY: '08t16e502526fesanfjh8nasd2',
  sharedSecret: 'tg:D/|oP$:s2I[-8-Pc:|8/U7+?!r]g#',
  // API
  commonApiUrl: `${host}/commonApi24`,
  farmerApiUrl: `${host}/farmerApi24`,
  fetchApiUrl: `${host}/fetchApi24`,
  otherApiUrl: `${host}/otherApi24`,
  deptApiUrl: `${host}/deptApi24`,

  // Module
  login: `${host}/`,
  society: `${host}/ufp24/society/`,
  tehsil: `${host}/ufp24/tehsil/`,
  report: `${host}/ufp24/report/`,
  ganna: `${host}/ufp24/ganna/`,
  admin: `${host}/ufp24/admin/`,
  printCSS: `${host}/commonApi24/printcss.css`
};
