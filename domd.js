const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { Client } = require('pg');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua');
const dotenv = require('dotenv');

dotenv.config();

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUA());

const { JSDOM } = jsdom;

const DELAYS = {
  AFTER_PAGE: 400,
  AFTER_ERROR: 500,
  BETWEEN_CITIES: 2000
};

const state = {
  shouldTerminate: false
};

const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
};

const wait = (delay) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, delay);
});

const { getMessage, sendMessage } = (() => {
  const receivedMessages = {};
  
  const sendMessage = (key, data) => {
    if (receivedMessages[key] !== undefined) {
      throw new Error('Old message still exists');
    }

    receivedMessages[key] = data;
  }

  const getMessage = (key) => new Promise(async (resolve) => {
    const RETRY_DELAY = 200;
    const MAX_WAIT = 20000;

    let count = 0;

    while (receivedMessages[key] === undefined && count < MAX_WAIT) {
      count += RETRY_DELAY;

      await wait(RETRY_DELAY);
    }

    const result = receivedMessages[key];
    receivedMessages[key] = undefined;

    return resolve(result);
  });

  return { getMessage, sendMessage };
})();

const getCities = async () => {
  const initialCities = { 'Warszawa': 'https://www.domd.pl/pl-pl/warszawa/lista-inwestycji' };

  const { default: fetch } = await import('node-fetch');
  const resp = await fetch(initialCities['Warszawa']);
  const html = await resp.text();

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  return Array.from(doc.querySelectorAll('.m-Header__version-city ul li a')).reduce((result, el) => ({
    ...result,
    [el.title]: `${el.href}/lista-inwestycji`
  }), initialCities);
}

const startBrowser = async () => {
	const browser = await puppeteer.launch({
    timeout: DELAYS.INITIAL_NAVIGATION,
		args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-sync',
      ...(process.env.PROXY_URL ? [`--proxy-server=${process.env.PROXY_URL}`] : [])
    ],
    executablePath: process.env.BROWSER_PATH,
    headless: !process.env.NO_HEADLESS ? 'new' : false,
    devtools: Boolean(process.env.WITH_DEVTOOLS),
    ignoreHTTPSErrors: true
	});
  
  const page = await browser.newPage();

  if (process.env.BROWSER_USER_AGENT) {
    await page.setUserAgent(process.env.BROWSER_USER_AGENT);
  }

  if (process.env.PROXY_URL && process.env.PROXY_USER && process.env.PROXY_PASS) {
    await page.authenticate({ username: process.env.PROXY_USER, password: process.env.PROXY_PASS });
  }

  await page.setDefaultNavigationTimeout(DELAYS.INITIAL_NAVIGATION); 

  await page.setRequestInterception(true);

  await page.exposeFunction('sendMessage', sendMessage);

  page.on('request', (req) => {
    if (['font', 'image', 'stylesheet'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const terminate = async () => await browser.close();

  return {
    page,
    terminate
  };
}

const waitForPage = async (page, url) => {
  return Promise.all([
    page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
    url ? page.goto(url, { waitUntil: 'domcontentloaded' }) : Promise.resolve()
  ]);
}

const save = async (client, inv, ts) => {
  if (client) {
    try {
      await client.query('BEGIN;');

      if (inv.flats) {
        for (let flt of inv.flats) {
          const query = `INSERT INTO flats VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);`;
          const params = ['domd', inv.city, inv.name, inv.address, flt.ident, flt.area, flt.rooms, flt.level, flt.building, flt.flat, flt.dueDate, flt.priceM2, flt.priceM2Discount, flt.priceFull, flt.priceFullDiscount, flt.isPromo, ts, flt.url];
          await client.query(query, params);
        }
      }

      if (inv.garages) {
        for (let grg of inv.garages) {
          const query = `INSERT INTO garages VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
          const params = ['domd', inv.city, inv.name, inv.address, grg.ident, grg.kind, grg.level, grg.price, null, null, ts, null];
          await client.query(query, params);
        }
      }

      if (inv.storages) {
        for (let stg of inv.storages) {
          const query = `INSERT INTO storages VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
          const params = ['domd', inv.city, inv.name, inv.address, stg.ident, stg.kind, stg.level, stg.price, null, null, ts, null];
          await client.query(query, params);
        }
      }
      await client.query('COMMIT;');
    } catch (e) {
      console.error(e);
      await client.query('ROLLBACK;');
    }
  } else {
    if (inv.flats) {
      for (let flt of inv.flats) {
        const params = ['domd', inv.city, inv.name, inv.address, flt.ident, flt.area, flt.rooms, flt.level, flt.building, flt.flat, flt.dueDate, flt.priceM2, flt.priceM2Discount, flt.priceFull, flt.priceFullDiscount, flt.isPromo, ts, flt.url];
  
        fs.appendFileSync(flatsFile, params.join(';') + '\n', { encoding: 'utf-8' });
      }
    }

    if (inv.garages) {
      for (let grg of inv.garages) {
        const params = ['domd', inv.city, inv.name, inv.address, grg.ident, grg.kind, grg.level, grg.price, null, null, ts, null];
  
        fs.appendFileSync(garagesFile, params.join(';') + '\n', { encoding: 'utf-8' });
      }
    }

    if (inv.storages) {
      for (let stg of inv.storages) {
        const params = ['domd', inv.city, inv.name, inv.address, stg.ident, stg.kind, stg.level, stg.price, null, null, ts, null];
  
        fs.appendFileSync(storagesFile, params.join(';') + '\n', { encoding: 'utf-8' });
      }
    }
  }
}

const visitUrl = async ({ page, terminate }, url, additionalDelay = DELAYS.AFTER_PAGE) => {
  try {
    await waitForPage(page, url);
    await wait(additionalDelay);
    return page;
  } catch (e) {
    console.error(e);
    await terminate();
    state.shouldTerminate = true;
    return null;
  }
}

const getInvestments = async (page) => {
  await page.evaluate(() => {
    try {
      const result = Array.from(document.querySelectorAll('.c-BoxInvestments > a.c-BoxInvestments__container')).map((el) => ({
        name: el.querySelector('h3').textContent.trim(),
        address: el.querySelector('.c-BoxInvestments__details').textContent.trim(),
        url: el.href
      })).reduce((result, item) => [...result, ...(result.find(({ name }) => name === item.name) ? [] : [item])], [])

      window.sendMessage('investments', result);
    } catch (e) {
      console.error(e);
      window.sendMessage('investments', null);
    }
  });

  return await getMessage('investments');
}

const getGarages = async (browser, url) => {
  console.log(`...garages...`);

  const page = await visitUrl(browser, url);
  
  if (!page) {
    return;
  }

  await page.evaluate(() => {
    try {
      const result = Array.from(document.querySelectorAll('.c-Garage')).map((el) => {
        const ident = el.querySelector('.c-Garage__info-number').textContent.trim();
        const kind = el.querySelector('.c-Garage__info-type').textContent.trim();
        const level = el.querySelector('.c-Garage__info-level').textContent.trim();
        const price = el.querySelector('.c-Garage__info-price').childNodes[0].textContent.trim();
  
        return { level, ident, price, kind };
      });

      window.sendMessage('garages', result);
    } catch (e) {
      console.error(e);
      window.sendMessage('garages', null);
    }
  });

  const garages = await getMessage('garages');

  if (!garages) {
    await wait(50000);
  }

  return garages;
}

const getStorages = async (browser, url) => {
  console.log(`...storages...`);

  const page = await visitUrl(browser, url);
  
  if (!page) {
    return;
  }

  await page.evaluate(() => {
    try {
      const result = Array.from(document.querySelectorAll('.c-Storage')).map((el) => {
        const ident = el.querySelector('.c-Storage__info-number').textContent.trim();
        const kind = el.querySelector('.c-Storage__info-type').textContent.trim();
        const level = el.querySelector('.c-Storage__info-level').textContent.trim();
        const price = el.querySelector('.c-Storage__info-price').childNodes[0].textContent.trim();

        return { level, ident, price, kind };
      });

      window.sendMessage('storages', result);
    } catch (e) {
      console.error(e);
      window.sendMessage('storages', null);
    }
  });

  return await getMessage('storages');
}

const getFlats = async (page) => {
  await page.evaluate(() => {
    try {
      const result = Array.from(document.querySelectorAll('.c-BoxFlat > a')).map((el) => ({
        url: el.href,
        ident: el.querySelector('.c-BoxFlat__flat').textContent.trim(),
        area: el.querySelector('.c-BoxFlat__area').textContent.trim(),
        rooms: el.querySelector('.c-BoxFlat__rooms').textContent.trim(),
        level: el.querySelector('.c-BoxFlat__floor').textContent.trim()
      }));

      window.sendMessage('flats', result);
    } catch (e) {
      console.error(e);
      window.sendMessage('flats', null);
    }
  });

  return await getMessage('flats');
}

const parseFlat = async (browser, flt, flatCounter) => {
  console.log(`flat [${flatCounter}]: ${flt.ident}`);

  const page = await visitUrl(browser, flt.url);
  
  if (!page) {
    return;
  }

  await page.evaluate(() => {
    try {
      const pc = document.querySelector('.m-FlatCard__info-price');
      const pl = pc.querySelector('.m-FlatCard__info-priceLeft');
      const pr = pc.querySelector('.m-FlatCard__info-priceRight');
      const isPromo = pc.classList.contains('isPromo');
  
      const result = {
        building: document.querySelector('.m-FlatCard__info-flat').children[0].children[0].textContent.trim(),
        flat: document.querySelector('.m-FlatCard__info-flat').children[1].children[0].textContent.trim(),
        dueDate: document.querySelector('.m-FlatCard__info-date').textContent.replace(/^Termin realizacji/g, '').trim(),
        priceM2: pl.children[0].textContent.trim(),
        priceM2Discount: isPromo ? pr.children[0].textContent.trim() : '',
        priceFull: isPromo ? pl.children[1].textContent.trim() : pr.children[0].textContent.trim(),
        priceFullDiscount: isPromo ? pr.children[1].textContent.trim() : '',
        isPromo
      };

      window.sendMessage('flat', result);
    } catch (e) {
      console.error(e);
      window.sendMessage('flat', null);
    }
  });

  return await getMessage('flat');
}

const parseInvestment = async (browser, inv, invCounter) => {
  console.log(`Investment [${invCounter}]: ${inv.name} (${inv.url})`);

  const page = await visitUrl(browser, inv.url);
  
  if (!page) {
    return;
  }

  await page.evaluate(() => {
    document.querySelector('.c-BoxOtherFlats__button').click();
  });

  await waitForPage(page);

  const invSearchUrl = await page.url();
  const parsedUrl = URL.parse(invSearchUrl);
  parsedUrl.searchParams.set('type', 'ga');
  const garagesUrl = parsedUrl.href;
  parsedUrl.searchParams.set('type', 'st');
  const storageUrl = parsedUrl.href;

  const flats = await getFlats(page);
  const garages = await getGarages(browser, garagesUrl);
  const storages = await getStorages(browser, storageUrl);

  let flatCounter = 0;
  for (let flt of flats) {
    flatCounter++;
    const flatData = await parseFlat(browser, flt, `${flatCounter}/${flats.length}`);

    Object.assign(flt, flatData);
  }

  return { flats, garages, storages };
}

const parseCity = async (client, { city, url, ts }, cityCounter) => {
  console.log(`City [${cityCounter}]: ${city} (${url})`);

  const browser = await startBrowser();
  const page = await visitUrl(browser, url);

  if (!page) {
    return;
  }
  
  const investments = await getInvestments(page);

  await browser.terminate();

  let invCounter = 0;
  for (let inv of investments) {
    invCounter++;

    const browser = await startBrowser();
    
    const data = await parseInvestment(browser, inv, `${invCounter}/${investments.length}`);

    Object.assign(inv, { city, ...data });

    await save(client, inv, ts);
  
    await browser.terminate();
  }
}

const ts = new Date().valueOf();

const flatsFile = path.resolve(__dirname, `./data/domd_${ts}_flats.csv`);
const garagesFile = path.resolve(__dirname, `./data/domd_${ts}_garages.csv`);
const storagesFile = path.resolve(__dirname, `./data/domd_${ts}_storages.csv`);

const createFiles = () => {
  fs.writeFileSync(flatsFile, '', { encoding: 'utf-8' });
  fs.writeFileSync(garagesFile, '', { encoding: 'utf-8' });
  fs.writeFileSync(storagesFile, '', { encoding: 'utf-8' });
}

const getClient = async () => {
  if (process.env.SAVE_TO_FILE) {
    createFiles();
    return null;
  }

  if (Object.values(dbConfig).every(Boolean)) {
    try {
      const client = new Client({ ...dbConfig });
      await client.connect();
      return client;
    } catch (e) {
      console.error(e);
      createFiles();
      return null;
    }
  }

  createFiles();
  return null;
}

const main = async () => {
  const client = await getClient();
  const cities = await getCities();

  let cityCounter = 0;
  for (let city in cities) {
    cityCounter++;
    const url = cities[city];

    if (state.shouldTerminate) {
      break;
    }

    try {
      await parseCity(client, { city, url, ts }, `${cityCounter}/${Object.keys(cities).length}`);
    } catch (e) {
      console.error(e);
      break;
    }

    await wait(DELAYS.BETWEEN_CITIES);
  }

  if (client) {
    await client.end();
  }
}

main();
