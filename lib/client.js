const net = require('net');

const _createTunnel = (remoteServer, localServer, code) => createTunnel => {
    const local = net.connect({
        host: localServer.host,
        port: localServer.port
    });
    local.setKeepAlive(true);
    local.on('error', err => {
        console.log('local error', err);
    });

    const remote = net.connect({
        host: remoteServer.host,
        port: remoteServer.port
    });
    remote.setKeepAlive(true);
    remote.once('connect', function() {
        console.log('connected to remote');
        if (code != undefined) {
            remote.write(code);
        }
    });
    remote.on('data', data => {
        // console.log('remote has data', data.toString())
    });
    remote.on('error', function(err) {
        console.log(Date.now(), 'remote connection error');
        remote.end();
        local.end();
        setTimeout(createTunnel.bind(null, createTunnel), 1000);
    });
    remote.on('end', data => {
        local.end();
        console.log('Remote end, restarting', new Date())
        createTunnel(createTunnel);
    });

    local.on('end', (data) => {
        remote.end();
        console.log('Local end, restarting', new Date())
        //createTunnel(createTunnel);
    });

    remote.pipe(local).pipe(remote);
};

module.exports = async (remoteServer, localServer, tunnels = 10) => {
    const createTunnel = _createTunnel(remoteServer, localServer);
    while (tunnels--) {
        await create(createTunnel, createTunnel);
    }
};

function create(func, arg) {
    return new Promise(resolve =>
        setTimeout(() => {
            func(arg), resolve()
        }, 1000)
    )
}
