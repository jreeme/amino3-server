function login() {
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  postal.login(username, password, function (e, yore) {
    var ee = e;
  });
}
