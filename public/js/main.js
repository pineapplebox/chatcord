const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();
var TypeMs = 0;
var typeUsers = [];

// Init TinyMCE plugin
tinymce.init({
  selector: "#msg",
  content_style: 'img {max-width: 600px;}',
  auto_focus : "msg",
  plugins: "autoresize link lists emoticons image",
  toolbar: "bold italic underline strikethrough | forecolor | link blockquote emoticons image | mySendButton",
  setup: function (editor) {
    editor.ui.registry.addButton("mySendButton", {
      tooltip: "Send Message",
      text: '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Font_Awesome_5_solid_paper-plane.svg/1200px-Font_Awesome_5_solid_paper-plane.svg.png" alt="" style="width: 13px; height: 13px;"> <b style="font-size: 16px; position: relative; top: -1px;">Send</b>',
      onAction: function () {
        sendMsg(editor);
      }
    });
    editor.on('keydown', function (e) {
      if(e.keyCode == 13 && !e.shiftKey) {
	e.preventDefault();
	e.stopPropagation();
        sendMsg(editor);
        return false;
      } else {
	if (TypeMs == 0) {
           socket.emit('isTyping', true);
	}
	TypeMs = Date.now();
      }
    });
  },
  skin: "borderless",
  menubar: false,
  statusbar: false,
  width: "100%",
  max_height: 130,
  toolbar_location: "bottom",
  autoresize_bottom_margin: 0,
  contextmenu: false,
});

// Check whether user is typing
setInterval(function(){ var curTime = Date.now(); if (TypeMs != 0 && curTime - TypeMs > 20000) {TypeMs = 0; socket.emit('isTyping', false);} }, 10000);

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

//get isTyping info
socket.on('isTyping', ({ name, typing }) => {
  //console.log('User: ' + name + 'is typing? ' + typing);
  
  if ( typing == true ) {
    typeUsers.push(name);
  } else if ( typing == false ) { 
    var index = typeUsers.indexOf(name);
    if (index > -1) {
      typeUsers.splice(index, 1);
    }
  }
	
  if (typeUsers.length == 0) {
    console.log("No users typing");
  } else if (typeUsers.length == 1) {
    console.log(typeUsers[0] + "is typing");
  } else if (typeUsers.length == 2 || typeUsers.length > 2) {
    console.log(typeUsers[0] + "and " + (typeUsers.length - 1) + " others are typing")
  }
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
/*chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = tinyMCE.get('msg').getContent();
  
  alert(msg);

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  tinyMCE.get('msg').setContent('');
});*/

// Output message to DOM
// Add noscript to prevent xss
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  var dt = new Date();
  p.innerHTML += `<span>`+dt.toLocaleTimeString([], {timeStyle: 'short'})+`</span>`;
  div.appendChild(p);
  const para = document.createElement('div');
  para.classList.add('text');
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerHTML += '<input type="password" id="room-name-text" readonly="true" value="' + room + '" / >';
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  } else {
  }
});

function sendMsg(editor) {
  if (!editor.getContent().trim()) {
    return;
  }
  socket.emit('chatMessage', editor.getContent());
  socket.emit('isTyping', false);
  TypeMs = 0;
  editor.resetContent();
  editor.focus();
}
window.onload = function() {
  document.querySelector('#toggleName').addEventListener('click', toggleCode);
  const nameText = document.querySelector('#room-name-text');

  function toggleCode(e) {
    const tgt = e.target.firstElementChild;
    const type = nameText.getAttribute('type') === 'password' ? 'text' : 'password';
    nameText.setAttribute('type', type);
    tgt.classList.toggle('fa-eye');
  }
}
