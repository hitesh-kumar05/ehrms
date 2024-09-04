let fs = require('fs')
const config = require('config');
let PuppeteerHTMLPDF = require('puppeteer-html-pdf');
let handlebars = require('handlebars')
let template_path = config.get("templated_path")
let { getFarmerDetailsForPavtiByFsId } = require('../../fetchServer/services/farmerService.js');


let file_s = {
   registrationReciept: async function (dbkey, request, params, sessionDetails, callback) {
      const raw_html = fs.readFileSync(template_path + 'templates/pavati.html', 'utf8');
      let filledTemplate;
      getFarmerDetailsForPavtiByFsId(dbkey, request, params, sessionDetails, async (err, res) => {
         if (err) { callback(err, null) }
         else {
            const { basicDetails, landWithCropDetails, registration } = res;
            const lands = landWithCropDetails.map(land => {
               let temp_land = land
               temp_land.is_pc = temp_land.new_crop.some(crop => crop.crop_status_code == 3)
               temp_land.pc_crop = temp_land.new_crop.filter(crop => crop.crop_status_code === 3)
               temp_land.non_pc_crop = temp_land.new_crop.filter(crop => crop.crop_status_code !== 3)
               temp_land.is_non_pc = temp_land.non_pc_crop.length > 0
               delete temp_land.new_crop
               return temp_land
            })

            const is_pc = lands.some((crop) => crop.is_pc == true)
            filledTemplate = handlebars.compile(raw_html);
            filledTemplate = filledTemplate({ basic: basicDetails[0], is_pc: is_pc, lands: lands, s: registration })
            const options = {
               format: 'A4', "orientation": "portrait", width: '219mm',
               height: '297mm', dpi: 70
            };
            try {
               const start = process.hrtime(); // Get the current high-resolution time
               const htmlPDF = new PuppeteerHTMLPDF();
               htmlPDF.setOptions(options)
               const buffer = await htmlPDF.create(filledTemplate);
               console.log('PDF generation successful');
               const end = process.hrtime(start); // Get the time elapsed since start
               const executionTimeInMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2); // Convert to milliseconds
               const executionTimeInSeconds = (end[0] + end[1] / 1e9).toFixed(2); // Convert to seconds
               console.log(`Execution time: ${executionTimeInMs} ms`);
               console.log(`Execution time: ${executionTimeInSeconds} s`);
               callback(null, buffer)
            } catch (error) {
               callback({ err: `pdf generation faild - ${error}` }, null)
            }
         }
      })
   },
   htmltoPdf: async function (dbkey, request, params, sessionDetails, callback) {
      const raw_html = fs.readFileSync(template_path + 'templates/htmltopdf.html', 'utf8');
      let filledTemplate = handlebars.compile(raw_html);
      filledTemplate = filledTemplate({ html: params['html']})
      const options = {
         format: 'A4', landscape: params['orientation'] == 'landscape', margin: {
            left: "25px",
            right: "25px",
            top: "25px", bottom: "25px"
         }
      };
      try {
         const htmlPDF = new PuppeteerHTMLPDF();
         htmlPDF.setOptions(options)
         const buffer = await htmlPDF.create(filledTemplate);
         callback(null, buffer)
      } catch (error) {
         callback({ err: `pdf generation faild - ${error}` }, null)
      }
   }
}
module.exports = file_s