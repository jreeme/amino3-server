(function () {
  if ('WebSocket' in window) {
    var ws = new WebSocket('__WS_URL__');
    ws.onopen = function (e) {
      console.info('Opening web socket to \'__WS_URL__\'');
    };
    ws.onclose = function (e) {
      var errors = [];
      errors[1000] = 'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
      errors[1001] = 'An endpoint is \'going away\', such as a server going down or a browser having navigated away from a page.';
      errors[1002] = 'An endpoint is terminating the connection due to a protocol error.';
      errors[1003] = 'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
      errors[1004] = 'Reserved. The specific meaning might be defined in the future.';
      errors[1005] = 'No status code was actually present.';
      errors[1006] = 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame.';
      errors[1007] = 'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).';
      errors[1008] = 'An endpoint is terminating the connection because it has received a message that \'violates its policy\'. This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
      errors[1009] = 'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
      errors[1010] = 'An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension';
      errors[1011] = 'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
      errors[1015] = 'The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
      if (e.code === 1000) {
        console.info(errors[1000]);
      } else {
        console.error(errors[e.code] ? errors[e.code] : 'Unknown Error');
      }
    };
    ws.onerror = function (e) {
      console.error('WebSocket error: ' + JSON.stringify(e));
    };
    ws.onmessage = function (e) {
    };
    postal.subscribe({
      channel: 'WebSocket',
      topic: 'Broadcast',
      callback: function (data) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
          }
        } catch (err) {
          console.error(err.message);
        }
      }
    });
    postal.login = function (username, password, cb) {
      postal.publish({
        channel: 'WebSocket',
        topic: 'Broadcast',
        data: {
          channel: 'Authentication',
          topic: 'Login',
          data: {
            username: username,
            password: password
          }
        }
      });
    }
  }
  else {
    alert('WebSockets are required but not supported by this browser');
  }
})();

