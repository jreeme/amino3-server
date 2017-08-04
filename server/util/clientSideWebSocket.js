(function () {
  var ws = new WebSocket('__WS_URL__');
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
})();
