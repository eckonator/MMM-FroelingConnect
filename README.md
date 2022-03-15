# MMM-FroelingConnect
Heating visualization module for [MagicMirror²](https://github.com/MichMich/MagicMirror). The module builds charts to your FRÖLING pellet boiler based on data from the FRÖLING Connect API. Inspiration and code base comes from [TA2k/ioBroker.froeling](https://github.com/TA2k/ioBroker.froeling).

## Screenshot
![](MMM-FroelingConnect.png)

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/eckonator/MMM-FroelingConnect.git
````

Install dependencies:
````
cd ~/MagicMirror/modules/MMM-FroelingConnect
````

````
npm install
````

Configure the module in your `config.js` file.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
    {
        module: 'MMM-FroelingConnect',
        position: 'middle_center',
        header: 'FRÖLING PE1 / Heizungsvisualisierung',
        config: {
            username: 'youremail@provider.com', // FRÖLUNG Connect - APP Username or Email.
            password: 'yourPassword', // FRÖLUNG Connect - APP Password.
            interval: 5, // Interval in minutes how often the data should be fetched from the API.
            showComponents: [
                'Austragung',
                'Puffer 01',
                'Boiler 01',
                'Heizkreis 01',
                'Kessel'
            ], // Names of the components to be visualized.
            showComponentDetailValues: [
                'Füllstand im Pelletsbehälter',
                'Resetierbarer t-Zähler:',
                'Resetierbarer kg-Zähler:',
                'Zähler RESET',
                'Pelletlager Restbestand',
                'Pelletlager Mindestbestand',
                'Pelletverbrauch Gesamt',
                'Pelletverbrauch-Zähler',
                'Puffertemperatur oben',
                'Puffertemperatur unten',
                'Pufferladezustand',
                'Pufferpumpen Ansteuerung',
                'Boilertemperatur oben',
                'Boilerpumpe Ansteuerung',
                'Vorlauf-Isttemperatur',
                'Vorlauf-Solltemperatur',
                'Außentemperatur',
                'Kesseltemperatur',
                'Abgastemperatur',
                'Verbleibende Heizstunden bis zur Asche entleeren Warnung',
                'Saugzug - Ansteuerung',
                'Restsauerstoffgehalt'
            ], // Names of the components details to be displayed under visualization.
            modulWidth: '700px', // Max width in px, %, vw, em ... for this module.
            showComponentName: true, // Display the component name.
            showComponentImage: true, // Display the component visualization.
            showComponentDetails: true, // Display the component details.
            componentWithBorder: true, // Display a border around each component.
            amongComponents: false, // Display components from top to bottom.
            runOwnJsonApiServerInLocalNetwork: false, // If you wan't to provide the API data in your local network, enable this.
            ownJsonApiServerPort: 3000 // Port where the local network API server is listening. Example: http://your-magicmirror-ip:3000
        }
    }
]
````

## Configuration options

The following property can be configured:

| Option                            | Description                                                                                      |                                                                                                                                                                                                                                                                                                Default value                                                                                                                                                                                                                                                                                                 |
|-----------------------------------|--------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| username                          | FRÖLUNG Connect - APP Username or Email.                                                         |                                                                                                                                                                                                                                                                                         ```youremail@provider.com```                                                                                                                                                                                                                                                                                         |
| password                          | FRÖLUNG Connect - APP Password.                                                                  |                                                                                                                                                                                                                                                                                              ```yourPassword```                                                                                                                                                                                                                                                                                              |
| interval                          | Interval in minutes how often the data should be fetched from the API.                           |                                                                                                                                                                                                                                                                                                   ```5```                                                                                                                                                                                                                                                                                                    |
| showComponents                    | Names of the components to be visualized.                                                        |                                                                                                                                                                                                                                                                   ```['Austragung', 'Puffer 01', 'Boiler 01', 'Heizkreis 01', 'Kessel']```                                                                                                                                                                                                                                                                   |
| showComponentDetailValues         | Names of the components details to be displayed under visualization.                             | ```['Füllstand im Pelletsbehälter', 'Resetierbarer t-Zähler:', 'Resetierbarer kg-Zähler:', 'Zähler RESET', 'Pelletlager Restbestand', 'Pelletlager Mindestbestand', 'Pelletverbrauch Gesamt', 'Pelletverbrauch-Zähler', 'Puffertemperatur oben', 'Puffertemperatur unten', 'Pufferladezustand', 'Pufferpumpen Ansteuerung', 'Boilertemperatur oben', 'Boilerpumpe Ansteuerung', 'Vorlauf-Isttemperatur', 'Vorlauf-Solltemperatur', 'Außentemperatur', 'Kesseltemperatur', 'Abgastemperatur', 'Verbleibende Heizstunden bis zur Asche entleeren Warnung', 'Saugzug - Ansteuerung', 'Restsauerstoffgehalt']``` |
| modulWidth                        | Max width in px, %, vw, em ... for this module.                                                  |                                                                                                                                                                                                                                                                                                 ```700px```                                                                                                                                                                                                                                                                                                  |
| showComponentName                 | Display the component name.                                                                      |                                                                                                                                                                                                                                                                                                  ```true```                                                                                                                                                                                                                                                                                                  |
| showComponentImage                | Display the component visualization.                                                             |                                                                                                                                                                                                                                                                                                  ```true```                                                                                                                                                                                                                                                                                                  |
| showComponentDetails              | Display the component details.                                                                   |                                                                                                                                                                                                                                                                                                  ```true```                                                                                                                                                                                                                                                                                                  |
| componentWithBorder               | Display a border around each component.                                                          |                                                                                                                                                                                                                                                                                                  ```true```                                                                                                                                                                                                                                                                                                  |
| amongComponents                   | Display components from top to bottom.                                                           |                                                                                                                                                                                                                                                                                                 ```false```                                                                                                                                                                                                                                                                                                  |
| runOwnJsonApiServerInLocalNetwork | If you wan't to provide the API data in your local network, enable this.                         |                                                                                                                                                                                                                                                                                                 ```false```                                                                                                                                                                                                                                                                                                  |
| ownJsonApiServerPort              | Port where the local network API server is listening. Example: `http://your-magicmirror-ip:3000` |                                                                                                                                                                                                                                                                                                  ```3000```                                                                                                                                                                                                                                                                                                  |


