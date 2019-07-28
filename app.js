const express = require('express'),
    app = express(),
    http = require('http'),
    httpProxy = require('http-proxy')
app.set('port', process.env.PORT || 5000)
var proxy = httpProxy.createProxyServer()

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    proxyReq.setHeader('Origin', 'https://ani.gamer.com.tw')
    proxyReq.setHeader('Host', 'gamer-cds.cdn.hinet.net')
})

//modified from https://stackoverflow.com/questions/49839718/how-do-i-inject-a-snippet-after-the-opening-body-tag-in-a-reverse-proxied-respon
proxy.on('proxyRes', (proxyRes, req, res, options) => {
    if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].indexOf("application/vnd.apple.mpegurl") >= 0) {
        if (proxyRes.headers["content-length"]) delete proxyRes.headers["content-length"]
        proxyRes.on('data', data => {
            let dataStr = data.toString()
            if (dataStr.indexOf("https://gamer-cds.cdn.hinet.net") >= 0) {
                dataStr = dataStr.replace("https://gamer-cds.cdn.hinet.net", "http://"+req.headers['host'])
                res.write(Buffer.from(dataStr, "utf8"))
            } else res.write(data)
        })
        proxyRes.on('end', () => res.end())
    } else proxyRes.pipe(res)
})

app.all('*', (req, res) => {
    proxy.web(req, res, {
        target: 'http://gamer-cds.cdn.hinet.net',
        selfHandleResponse: true
    }, e => console.log(e))
})

http.createServer(app).listen(app.get('port'), () => console.log('Express server listening on port ' + app.get('port')))