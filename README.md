# property-companies-scrapper
Example scripts for scrapping offers data from polish property developers

## prerequisites
- NodeJS
- Web browser compatible with Puppeteer, preferably Chrome/Chromium
- PostgreSQL - if you want to save data to database instead of plain files

## installation
```
npm install
```

## configuration
Provide environmental variables via .env file (example file .env-example provided, just rename it to .env and edit to your liking) or prepend script execution directly in command line
`BROWSER_PATH` - required, executable path of your web browser

`BROWSER_USER_AGENT` - user agent string to apply to your browser

`DB_USER` - database user

`DB_HOST` - database host

`DB_NAME` - database name

`DB_PORT` - database port

`DB_PASS` - database password

`PROXY_URL` - url of a proxy server if you want to use one

`PROXY_USER` - username to authenticate in your proxy

`PROXY_PASS` - password to authenticate in your proxy

`NO_HEADLESS` - should the script open browser window

`WITH_DEVTOOLS` - when NO_HEADLESS is enabled, should the browser window open with devtools visible

`SAVE_TO_FILE` - force save to file instead of database

## usage
As of now, there is one script for DevD company

### download
`download` script triggers full scraping of all data from website

```
npm run devd download
```

You can run the script only for one city if needed (name of the city as in company website)
```
npm run devd download "Warszawa"
```

You can run the script only for one city and for one investment (selected by part of the name), investment name filter is case insensitive
```
npm run devd download "Warszawa" "beethovena"
```

### cities
`cities` script parses only in which cities are investments from a developer available

```
npm run devd cities
```

### investments
`investments` script parses only list of investments from a developer which are available

```
npm run devd investments
```

You can still filter them to only one city
```
npm run devd investments "Warszawa"
```
