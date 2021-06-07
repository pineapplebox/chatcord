const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Init TinyMCE plugin
tinymce.init({
  selector: "#msg",
  content_style: 'img {max-width: 600px;}',
  plugins: "autoresize link lists emoticons image",
  toolbar: "bold italic underline strikethrough | forecolor | link blockquote emoticons image | mySendButton",
	setup: function (editor) {
    editor.ui.registry.addButton("mySendButton", {
      tooltip: "Send Message",
	  text: '<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Font_Awesome_5_solid_paper-plane.svg/1200px-Font_Awesome_5_solid_paper-plane.svg.png" alt="" style="width: 13px; height: 13px;"> <strong style="font-size: 13px;">Send</strong>',
      onAction: function () {
        if (!editor.getContent()) {
          return false;
        }
        socket.emit('chatMessage', editor.getContent());
		    editor.resetContent();
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

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
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
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('div');
  para.classList.add('text');
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
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
