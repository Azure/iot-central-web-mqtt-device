# iot-central-web-mqtt-device
Create a simple IoT device that runs fully contained in the web browser that can communicate with Azure IoT Central over MQTT (using websockets).


## Introduction

This project is based in large part on the work done by Github user [ridomin](https://github.com/ridomin) in the repository [iothub-webclient](https://github.com/ridomin/iothub-webclient), take a look at his repository for the details on what is happening below the covers.  In this project I have focused the sample on connecting to an IoT Central application and it exclusively uses the Device Provisioning Service (DPS) for the provisioning and connection of the device.  IoT Central does not support connection strings and requires the device to use DPS to obtain it the location of it's IoT hub, this allows a device to be moved between hubs and in the near futrure for IoT Central to support IoT Hub redundancy.  The device running in the browser is also setup to run as an autonomous device very much like if the device was running in the real world.  The devices two way communication between IoT Central and itself can be observed in the console output on the web page once sending telemetry has been started.

The device supports the following functionality:

* Connection to IoT Central using DPS.  The device does not need to be registered in the application prior to connecting
* The device can be authenticated via either the device SAS token or the Group SAS token for the application (in this case the device SAS token is automatically generated)
* The device is automatically associated with the model identity provided by the user in the form
* Sending the telemetry values for temperature and humidity (randomly generated values in a range) ever ~5 seconds
* Sending the reported property of fan speed to IoT Central every ~10 seconds
* Accepting a desired (writable) property setTemp to set the temperature of a thermostat on the device
* Accepting the direct method call sendTextMessage from IoT Central with a text message and responding with a boolean return value if the message is read
* Accepting a cloud to device message startVacuumCleaner that takes a time value as a parameter (this is additional functionality over iothub-webclient version)

All communication and payloads are displayed on the web browser console output with the last 200 transmissions held in history.


## Hosting locally

To host this locally clone this repository to your computer and run the following:

``` 
npm install
npm start
```

The following should be seen after running the last command

```
> webmqtt@1.0.0 start D:\github\iot-central-web-mqtt-device
> node server.js

Listening at http://localhost:8080
```

If you see an error check to see if the port 8080 is already in use on your machine and if it is feel free to change the port to a free one by changing the code in server.js on line 23.

Open your browser of choice and go to the URL http://localhost:8080/device.html.  You should see the following in you browser:

![Initial browser screen](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/initialscreen.png "Initial browser screen")

Enjoy the retro 2010 web page look :-)

## Hosting on Azure

The code can obviously be hosted on any web service but in my case I chose to host using an [Azure function](https://azure.microsoft.com/en-us/services/functions/?&ef_id=CjwKCAiAsOmABhAwEiwAEBR0ZmNO6WIwjimRlpY2W-N4U_G99qJHALIQa-hykDyFhzNSz6bJl3x8nRoCVcYQAvD_BwE:G:s&OCID=AID2100131_SEM_CjwKCAiAsOmABhAwEiwAEBR0ZmNO6WIwjimRlpY2W-N4U_G99qJHALIQa-hykDyFhzNSz6bJl3x8nRoCVcYQAvD_BwE:G:s&gclid=CjwKCAiAsOmABhAwEiwAEBR0ZmNO6WIwjimRlpY2W-N4U_G99qJHALIQa-hykDyFhzNSz6bJl3x8nRoCVcYQAvD_BwE) as it is a cost effective way to host infrequently accessed static web pages.

I used [this blog post](https://www.wintellect.com/host-website-azure-functions-node-js-part-1/) to setup my Azure function.  The code needed for the Azure Function can be found in the file [azure-function/index.js](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/azure-function/index.js).  

You will need to copy the contents of the content directory up to your Azure Function location and also install the needed npm package mime-types.  All this is explained in the blog post.  Once you have followed the insdtructions you should be able to browse to your azure functions URL with https://<your-function-name>.azurewebsites.net/device.html and you should see the following in your browser:

![Initial browser screen](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/initialscreen.png "Initial browser screen")

Enjoy the retro 2010 web page look :-)


## Running your device in the browser

To run the device you are obviously going to need an Azure IoT Central application.  You can find instructions on getting started with Azure IoT Central [here](https://docs.microsoft.com/en-us/azure/iot-central/core/quick-deploy-iot-central#:~:text=the%20recommend%20path.-,Create%20an%20application,using%20a%20Custom%20apps%20template.).  Once you have an Azure IoT Central application you need to import in the device model used by this device.  The device model can be obtained either from the browser by clicking the link in the first page or by grabbing it from the GitHub repository [here](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/content/simple_device_model.json).

You can import in the model by looking at [this information](https://docs.microsoft.com/en-us/azure/iot-central/core/concepts-device-templates).  You can also create a [view](https://docs.microsoft.com/en-us/azure/iot-central/core/concepts-device-templates#views) for the device twin properties so you can send the writable property "setTemp" to the device.  

Once you have an Azure IoT Central application and have imported and published the device template you are ready to connect the device.  First thing we need to do is provide information so your device knows where to connect.  You are going to need to fill in the Scope Identity and Group SAS Token.  These can be obtained from the IoT Central application in the Administrator page under the Device connection tab.  

The Scope Identity can be obtained here and pasted into the browser form:

![Getting the Scope Identity](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/scopeid.png "Getting the Scope Identity")

The Group SAS Token can be obtained here and pasted into the browser form:

![Getting the Group SAS Token](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/saskey.png "Getting the Group SAS Token")

You should now see that the Device SAS Token has been populated with it's generated value and you are ready to click "Provision and Connect"!

The connection can take a few seconds especially on the first connection so give it a minute to connect if necessary.  Subsequent connections should be much quicker.  You should now see the following screen:

![Connected to IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/connected.png "Connected to IoT Central")

Now click the "Start Sending Telemetry" button and telemetry and reported properties will be sent to your IoT Central application.

![Telemetry flowing to IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/telemetryflowing.png "Telemetry flowing to IoT Central")

In the IoT Central you should be seeing data arrive in the raw data view and if you have set up a view of telemetry you will see a graph of the data:

![Raw telemetry in IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/rawtelemetryincentral.png "Raw telemetry in IoT Central")

![Telemetry in IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/telemetryincentral.png "Telemetry in IoT Central")

You can send commands to the device from the IoT Central application like this:

![Commands in IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/commands.png "Commands in IoT Central")

You can update the thermostat setting on the device using IoT Central like this:

![Writable properties in IoT Central](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/writableproperty.png "Writable properties in IoT Central")

These will show up in the console window respectively when they arrive at the device:

![Commands from IoT Central on device](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/commandatdevice.png "Commands from IoT Central on device")
![Writable properties from IoT Central on device](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/writablepropertyatdevice.png "Writable properties from IoT Central on device")

Finally the complete device twin can be pulled from IoT Central by clicking the "Fetch Full Twin" button and it will be displayed in the console window:

![Full device twin from IoT Central on device](https://github.com/iot-for-all/iot-central-web-mqtt-device/blob/main/assets/fulltwin.png "Full device twin from IoT Central on device")

## Features needed to be added

Right now there is no support for X.509 certificate authentication of the device in the codebase.  I'll try and get this added in the near future.
