(function () {
  postal.subscribe({
    channel: 'channel1',
    topic: 'topic1',
    callback: function (d, e) {
      $('#messages').append($('<li>').text(d.msg));
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
  $('form').submit(function () {
    const data = {
      channel: 'channel1',
      topic: 'topic1',
      data: {
        msg: $('#m').val()
      }
    };
    //postal.publish(data);
    postal.publish(
      {
        channel: 'WebSocket',
        topic: 'Broadcast',
        data: {
          channel: 'WebSocket',
          topic: 'Broadcast',
          data: data
        }
      }
    );
    return false;
  });
})();
