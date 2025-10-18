import React, { useImperativeHandle, useRef, useState } from "react";

type Props = {
	onCommand: (cmd: string) => void;
};

export type ChatBoxHandle = {
	focus: () => void;
};

const ChatBox = React.forwardRef<ChatBoxHandle, Props>(({ onCommand }, ref) => {
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null);

	useImperativeHandle(ref, () => ({
		focus: () => inputRef.current?.focus(),
	}));

	const submit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!value.trim()) return;
		onCommand(value.trim());
		setValue("");
	};

	return (
		<form onSubmit={submit} className="chat-form">
			<input
				ref={inputRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="type command (e.g. add snare)"
			/>
			<button type="submit">Send</button>
		</form>
	);
});

ChatBox.displayName = "ChatBox";

export default ChatBox;
