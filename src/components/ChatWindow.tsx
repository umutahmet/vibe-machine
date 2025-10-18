import React from "react";
import { useAppContext } from "../context/appContextCore";
import ChatBox from "./ChatBox";

const ChatWindow = React.forwardRef(function ChatWindowForward() {
	const { handleCommand, chatRef } = useAppContext();
	// forward the provider ref to the internal chat ref so parent (App) can call focus()
	return <ChatBox ref={chatRef} onCommand={handleCommand} />;
});

export default ChatWindow;
