import {
    AzDpsClient,
    createHmac
} from './AzDpsClient.js'
import {
    AzIoTHubClient,
    ackPayload
} from './AzIoTHubClient.js'

const createApp = () => {
    let telemetryInterval
    let reportedInterval
    let consoleEntries = 0
    const maxConsoleEntries = 200

    /** @type {AzIoTHubClient} client */
    let client
    // @ts-ignore
    const app = new Vue({
        el: '#app',


        data: {
            saveConfig: true,
            viewDpsForm: false,
            disableDeviceKey: false,
            runningProvision: false,

            /** @type {ConnectionInfo} */
            connectionInfo: {
                scopeId: '',
                hubName: '',
                deviceId: 'SimpleDevice01',
                deviceKey: '',
                modelId: 'dtmi:simpleModel:simplesample;1',
                status: 'Disconnected',
                connected: false
            },

            /** @type {Array<CommandInfo>} */
            isTelemetryRunning: false,
            statusConsole:''
        },


        async created() {
            /** @type { ConnectionInfo } connInfo */
            const connInfo = JSON.parse(window.localStorage.getItem('connectionInfo') || '{}')

            connInfo.deviceId = connInfo.deviceId

            if (connInfo.scopeId) {
                this.connectionInfo.scopeId = connInfo.scopeId
                if (connInfo.masterKey) {
                    this.connectionInfo.masterKey = connInfo.masterKey
                    this.connectionInfo.deviceKey = await createHmac(this.connectionInfo.masterKey, this.connectionInfo.deviceId)
                }
            }

            if (connInfo.hubName) {
                this.connectionInfo.hubName = connInfo.hubName
                this.connectionInfo.deviceId = connInfo.deviceId
                this.connectionInfo.deviceKey = connInfo.deviceKey
                this.connectionInfo.modelId = connInfo.modelId
            }
        },


        methods: {

            writeToConsole(content, color) {
                if (consoleEntries >= maxConsoleEntries) {
                    this.statusConsole = this.statusConsole.substring(this.statusConsole.indexOf('</div>')+6)
                    consoleEntries--
                }
                this.statusConsole += '<div style="color: ' + color + ';">' + content + '</div>'
                consoleEntries++
            },

            async provision() {
                window.localStorage.setItem('connectionInfo',
                    JSON.stringify({
                        scopeId: this.connectionInfo.scopeId,
                        hubName: this.connectionInfo.hubName,
                        deviceId: this.connectionInfo.deviceId,
                        deviceKey: this.connectionInfo.deviceKey,
                        masterKey: this.connectionInfo.masterKey,
                        modelId: this.connectionInfo.modelId
                    }))
                const dpsClient = new AzDpsClient(this.connectionInfo.scopeId, this.connectionInfo.deviceId, this.connectionInfo.deviceKey, this.connectionInfo.modelId)
                this.runningProvision = true
                const result = await dpsClient.registerDevice()
                this.runningProvision = false
                if (result.status === 'assigned') {
                    this.connectionInfo.hubName = result.registrationState.assignedHub
                    this.connect()
                } else {
                    console.log(result)
                    this.connectionInfo.hubName = result.status
                }
                this.viewDpsForm = false
            },


            async refreshDeviceId() {
                this.com
                this.connectionInfo.deviceId = 'device' + Date.now()
                await this.updateDeviceKey()
            },

            async desiredPropertyAck(patch, status, statusMsg) {
                // acknowledge the desired property back to IoT Central
                const patchJSON = JSON.parse(patch)
                const keyName = Object.keys(patchJSON)[0]
                let reported_payload = {}
                reported_payload[keyName] = {"value": patchJSON[keyName], "ac":status,"ad":statusMsg,"av":patchJSON['$version']}
                await client.updateTwin(JSON.stringify(reported_payload))
                this.writeToConsole("Desired property patch acknowledged: " + "<pre>" + this.syntaxHighlight(patch) + "</pre>", "cyan")
            },

            async processDirectMethods(method, payload, rid) {
                this.writeToConsole("Direct Method received: <pre>" + method + "(" + payload + ")</pre>", "green")
                let response = 'unknown command'
                let status = 404
                if (method == 'sendTextMessage') {
                    response = {"messageRead": true}
                    status = 200
                }
                this.writeToConsole("Direct Method response: <pre>(status: " + status + ", payload: " + "<pre>" + this.syntaxHighlight(response) + "</pre>" + ")</pre>", "green")
                await client.commandResponse(method, JSON.stringify(response), rid, status)
            },

            async processDesiredPropertyPatch(patch) {
                this.writeToConsole("Desired property patch received: " + "<pre>" + this.syntaxHighlight(patch) + "</pre>", "cyan")
                await this.desiredPropertyAck(patch, 200, "completed")
            },

            async processCloudToDeviceMessage(methodName, payload) {
                this.writeToConsole("Cloud to Device message received: <pre>" + methodName + "(" + payload + ")</pre>", "red")
            },

            async connect() {
                if (this.saveConfig) {
                    window.localStorage.setItem('connectionInfo',
                        JSON.stringify({
                            scopeId: this.connectionInfo.scopeId,
                            hubName: this.connectionInfo.hubName,
                            deviceId: this.connectionInfo.deviceId,
                            deviceKey: this.connectionInfo.deviceKey,
                            masterKey: this.connectionInfo.masterKey,
                            modelId: this.connectionInfo.modelId
                        }))
                }
                let host = this.connectionInfo.hubName
                if (host.indexOf('.azure-devices.net') === -1) {
                    host += '.azure-devices.net'
                }
                client = new AzIoTHubClient(host,
                    this.connectionInfo.deviceId,
                    this.connectionInfo.deviceKey,
                    this.connectionInfo.modelId)

                client.setDirectMethodCallback(this.processDirectMethods)

                client.setDesiredPropertyCallback(this.processDesiredPropertyPatch)

                client.setCloudToDeviceCallback(this.processCloudToDeviceMessage)

                client.disconnectCallback = (err) => {
                    console.log(err)
                    this.connectionInfo.connected = false
                    this.connectionInfo.status = 'Disconnected'
                }

                await client.connect()
                this.connectionInfo.status = 'Connected'
                this.connectionInfo.connected = true
            },

            getRandomArbitrary(min, max, decimals) {
                return +((Math.random() * (max - min) + min).toFixed(decimals));
            },

            startTelemetry() {    
                telemetryInterval = setInterval(() => {
                    const telemetryMessage = {"temp": this.getRandomArbitrary(32, 110, 2), "humidity": this.getRandomArbitrary(0, 100, 2)}
                    this.writeToConsole("Sending telemetry: " + "<pre>" + this.syntaxHighlight(telemetryMessage) + "</pre>", "#DEFFFF")
                    client.sendTelemetry(JSON.stringify(telemetryMessage))
                }, this.getRandomArbitrary(4500, 5500, 0))        
                
                reportedInterval = setInterval(() => {

                    const reportedMessage = {"fanspeed": this.getRandomArbitrary(0, 1000, 0)}
                    this.writeToConsole("Sending reported property: " + "<pre>" + this.syntaxHighlight(reportedMessage) + "</pre>", "orange")
                    client.updateTwin(JSON.stringify(reportedMessage))
                }, this.getRandomArbitrary(9500, 10500, 0))   

                this.isTelemetryRunning = true
            },

            stopTelemetry() {
                clearInterval(telemetryInterval)
                clearInterval(reportedInterval)
                this.isTelemetryRunning = false
            },

            clearConsole() {
                this.statusConsole = ''
                consoleEntries = 0
            },

            clearForm() {
                window.localStorage.removeItem('connectionInfo')
                this.connectionInfo = {
                    scopeId: '',
                    hubName: '',
                    deviceId: 'SimpleDevice01',
                    deviceKey: '',
                    modelId: 'dtmi:simpleModel:simplesample;1',
                    status: 'Disconnected',
                    connected: false
                }
            },

            syntaxHighlight(json) {
                if (typeof json != 'string') {
                     json = JSON.stringify(json, undefined, 2)
                }
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    var cls = 'number'
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key'
                        } else {
                            cls = 'string'
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean'
                    } else if (/null/.test(match)) {
                        cls = 'null'
                    }
                    return '<span class="' + cls + '">' + match + '</span>'
                })
            },

            async fetchTwin() {
                if (client.connected) {
                    const twin = await client.getTwin()
                    this.writeToConsole('<div style="color: white;">Current full twin:<pre>' + this.syntaxHighlight(twin) + '</pre></div>', 'white')
                }
            },

            async updateDeviceKey() {
                this.disableDeviceKey = true
                this.connectionInfo.deviceKey = await createHmac(this.connectionInfo.masterKey, this.connectionInfo.deviceId)
            }
        },

        computed: {
            connectionString() {
                return `HostName=${this.connectionInfo.hubName}.azure-devices.net;DeviceId=${this.connectionInfo.deviceId};SharedAccessKey=${this.connectionInfo.deviceKey}`
            }
        },
    })
    return app
}

(() => {
    createApp()
})()