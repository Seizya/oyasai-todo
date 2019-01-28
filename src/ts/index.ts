import * as pages from "./pages/_index";
pages.Init().then(ui => {
	ui.et.addEventListener("add-new-item", () => ui.addItem());
	ui.et.addEventListener("done-item", _ => ui.setStatus2Item(_.itemID, true));
	ui.et.addEventListener("undone-item", _ => ui.setStatus2Item(_.itemID, false));
	ui.et.addEventListener("remove-item", _ => {
		ui.removeItem(_.itemID);
		ui.setProgress(ui.getTotalETime(), ui.getTotalPtime());
	});
	ui.et.addEventListener("onchange-ptime", _ => {
		ui.setProgress(ui.getTotalETime(), ui.getTotalPtime());
	});
	const timers: Map<string, number> = new Map();
	ui.et.addEventListener("pause-timer", _ => {
		const id = _.itemID;
		const startTime = performance.now();
		if (timers.has(id)) {
			clearInterval(timers.get(id));
			timers.delete(id);
		} else {
			console.error("なぜ、このタイマーが死んでいるのか、それが疑問だ。");
		}
	});
	ui.et.addEventListener("start-timer", _ => {
		const id = _.itemID;
		const startTime = performance.now() - (ui.getETime(id) * 1000);
		if (timers.has(id)) {
			console.error("なぜ、このタイマーが生き残っているのか、それが疑問だ。");
			clearInterval(timers.get(id));
		}
		timers.set(id, setInterval(() => {
			ui.setETime2Item(id, (performance.now() - startTime) / 1000);
			ui.setProgress(ui.getTotalETime(), ui.getTotalPtime());
		}, 100));
	});
});
