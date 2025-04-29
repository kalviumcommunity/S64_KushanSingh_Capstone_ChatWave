import React from 'react';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

const dummyMessages = [
  { text: "Hey, what's up!", isOwn: false },
  { text: "All good! You?", isOwn: true },
  { text: "Doing well. Working on a cool project.", isOwn: false },
  { text: "Nice! Tell me more later!", isOwn: true },
];

const dummyConversations = [
  {
    id: 1,
    name: 'Alice',
    avatar: '/default-avatar.png',
    lastMessage: 'See you soon!',
  },
  {
    id: 2,
    name: 'Bob',
    avatar: '/default-avatar.png',
    lastMessage: 'Got it!',
  },
];

const Dashboard = () => {
  return (
    <div className="h-screen flex">
      <Sidebar conversations={dummyConversations} />
      <ChatWindow messages={dummyMessages} />
    </div>
  );
};

export default Dashboard;
