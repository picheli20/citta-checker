const puppeteer = require('puppeteer');
const notifier = require('node-notifier');
require('better-logging')(console);

const ratePerMinute = 5;

const person = {
  document: '#rdbTipoDocNie',
  documentNumber: '',
  name: '',
};

async function checkForCitas(page) {
  console.log('Starting the puppeteer check');
  await page.goto('https://sede.administracionespublicas.gob.es/icpplus/citar?p=4&locale=es');

  // Select type of appointment
  await page.waitForSelector('#divGrupoTramites');
  await page.select('#divGrupoTramites > div:nth-child(3) select', '4038')
  await page.click('#btnAceptar');

  // Click on "Entrar"
  await page.waitForTimeout(2000);
  await page.waitForSelector('#btnEntrar');

  await page.click('#btnEntrar');

  // Fill the personal information
  await page.waitForTimeout(8000);
  await page.waitForSelector(person.document);

  await page.click(person.document);

  await page.focus('#txtIdCitado');
  await page.keyboard.type(person.documentNumber);

  await page.focus('#txtDesCitado');
  await page.keyboard.type(person.name);

  await page.click('#btnEnviar');


  // Click on "Solicitar Cita"
  await page.waitForTimeout(8000);
  await page.waitForSelector('#btnEnviar');
  await page.click('#btnEnviar');

  // Check if there's some error message
  await page.waitForTimeout(8000);
  const msg = await page.$eval('#mainWindow > div > div > section > div.mf-main--content.ac-custom-content > form > div.mf-main--content.ac-custom-content > p', el => el.innerText);

  if (msg && msg.includes('En este momento no hay citas disponibles')) {
    console.log(`Nothing available, re-trying in ${ratePerMinute} minute`);
    setTimeout(() => checkForCitas(page), ratePerMinute * 60 * 1000);
  } else {
    notifier.notify(`There's citta available!`);
  }
}

(async () => {
  const browser = await puppeteer.launch({
      headless: false,
  })
  const page = await browser.newPage();

  await checkForCitas(page);

})()
