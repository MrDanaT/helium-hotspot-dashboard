# Helium Hotspot Dashboard

A simple [Helium](https://www.helium.com/) hotspot dashboard made in [Vue](https://vuejs.org/) which allows to see how much [$HNT](https://coinmarketcap.com/currencies/helium/) a given set of hotspots have earned on a daily bases.

Hosted on Heroku: https://helium-hotspot-dashboard.herokuapp.com/

## V2

The second version of the dashboard has a few more functionalities so far: including exporting the rewards from the selected period to Excel. This makes it easy to analyse the data with the tools that Excel provides.

### Example V2.1

![Example V2.1](./assets/V2_Example1.png)

### Example V2.2

![Example V2.2](./assets/V2_Example2.png)

### Example V2.3

![Example V2.3](./assets/V2_Example3.png)

### Project setup

For this project you need [npmjs](https://www.npmjs.com/) to install all packages with `npm i` and [serve](https://www.npmjs.com/package/serve) with `npm i serve -g`.

After that run `npm run build` which produces a production build of the project in the newly created `dist`-folder.

The last step is to run the production build with `serve -s dist`.

## Donations

If you've found the dashboard useful and want to donate some $HNT for my efforts, here's my wallet: `13hK5T4Qdys74xKHjBUEjatpuHkKMVaMYvUtvsB3Wt7zjm7g1Fy`.
