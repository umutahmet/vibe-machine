import "./App.css";
import ChatWindow from "./components/ChatWindow";
import Desktop from "./components/Desktop";
import GridWindow from "./components/GridWindow";
import ToolsWindow from "./components/ToolsWindow";
import TracksWindow from "./components/TracksWindow";
import TransportWindow from "./components/TransportWindow";
import AppProvider from "./context/AppContext";
import { useAppContext } from "./context/appContextCore";
import type { WindowState } from "./types";

function AppInner() {
	const { windows, updateWindowPosition, bringToFront } = useAppContext();

	const renderWindowContent = (window: WindowState) => {
		switch (window.type) {
			case "transport":
				return <TransportWindow />;
			case "grid":
				return <GridWindow />;
			case "tools":
				return <ToolsWindow />;
			case "chat":
				return <ChatWindow />;
			case "tracks":
				return <TracksWindow />;
			default:
				return <div>Unknown window type</div>;
		}
	};

	return (
		<Desktop
			windows={windows}
			onPositionChange={updateWindowPosition}
			onBringToFront={bringToFront}
			renderWindowContent={renderWindowContent}
		/>
	);
}

export default function App() {
	return (
		<AppProvider>
			<AppInner />
		</AppProvider>
	);
}
