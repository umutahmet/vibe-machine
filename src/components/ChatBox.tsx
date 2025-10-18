import { useState } from "react";

type Props = {
	onCommand: (cmd: string) => void;
};

export default function ChatBox({ onCommand }: Props) {
	const [value, setValue] = useState("");

	const submit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!value.trim()) return;
		onCommand(value.trim());
		setValue("");
	};

	return (
		<form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
			<input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="type command (e.g. add snare)"
			/>
			<button type="submit">Send</button>
		</form>
	);
}
