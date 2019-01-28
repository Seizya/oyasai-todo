import { onLoad } from "../lib-browser/util";
import { ge, ce } from "../lib-browser/dom";
import { ETarget } from "../lib-common/event-target";
import { padLeft } from "../lib-common/util";

export interface EMap {
	"add-new-item": null
	"start-timer": { itemID: string }
	"pause-timer": { itemID: string }
	"remove-item": { itemID: string }
	"done-item": { itemID: string }
	"undone-item": { itemID: string }
	"onchange-ptime": { time: number, itemID: string }
}

export interface InitResult {
	setProgress: (value: number, total: number) => void
	setPTime2Item: (itemID: string, time: number) => void
	setETime2Item: (itemID: string, time: number) => void
	setStatus2Item: (itemID: string, isDone: boolean) => void
	getPTime: (itemID: string) => number
	getETime: (itemID: string) => number
	getTotalETime: () => number
	getTotalPtime: () => number
	addItem: () => string
	removeItem: (itemID: string) => void
	et: ETarget<null, EMap>
}
export function init(): Promise<InitResult> {
	return new Promise(res => {
		onLoad(() => {
			const et = new ETarget<null, EMap>(null);
			ge("new_btn").addEventListener("click", () => et.dispatchEvent("add-new-item", null));
			res({
				setProgress,
				setPTime2Item,
				setETime2Item,
				setStatus2Item,
				getETime,
				getPTime,
				getTotalETime,
				getTotalPtime,
				addItem: addItem(et),
				removeItem,
				et
			});
		});
	});
}

function id2li(id: string): HTMLLIElement {
	return ge("item-" + id) as HTMLLIElement;
}
function id2etime(id: string): HTMLInputElement {
	return id2li(id).getElementsByClassName("todo_etime").item(0)! as HTMLInputElement;
}
function id2ptime(id: string): HTMLInputElement {
	return id2li(id).getElementsByClassName("todo_ptime").item(0)! as HTMLInputElement;
}

// Time to String
function t2s(t: number, withSec = true) {
	t <<= 0;
	const s = t % 60;
	t = (t / 60) << 0;
	const m = t % 60;
	t = (t / 60) << 0;
	const h = t % 60;
	t = (t / 60) << 0;
	return padLeft(h.toString(), 2, " ") + ":" +
		padLeft(m.toString(), 2, " ") +
		(withSec ? ":" + padLeft(s.toString(), 2, " ") : "");
}
function s2t(s: string): { success: boolean, value: number } {
	const parts = s.split(":").map(_ => parseInt(_));
	if (parts.length > 3 || parts.length < 0 || parts.some(_ => isNaN(_)))
		return { success: false, value: 0 };
	return { success: true, value: parts.reverse().reduce((pv, cv, i) => pv + cv * 60 ** i, 0) };
}

function setProgress(value: number, total: number) {
	ge("progress_text").innerText = t2s(value, false) + " / " + t2s(total, false);
	const ratio = total == 0 ? (value == 0 ? 0 : 100) : value / total * 100;
	ge("progress_bar").style.background = `linear-gradient(90deg, #b8e994 ${ratio}%, transparent ${ratio}%)`;
}
function setPTime2Item(itemID: string, time: number) {
	ptimeMap.set(itemID, time);
	id2ptime(itemID).value = t2s(time);
}
function setETime2Item(itemID: string, time: number) {
	etimeMap.set(itemID, time);
	id2etime(itemID).value = t2s(time);
}
function setStatus2Item(itemID: string, isDone: boolean) {
	ge(isDone ? "done_ul" : "todo_ul").appendChild(id2li(itemID));
}
function addItem(et: ETarget<null, EMap>) {
	return () => {
		const id = performance.now().toString(); // 重複しないはず、多分。
		createTodoItem(id, et);
		return id;
	};
}
function removeItem(itemID: string) {
	id2li(itemID).remove();
	ptimeMap.delete(itemID);
	etimeMap.delete(itemID);
}
function createTodoItem(itemID: string, et: ETarget<null, EMap>) {
	const ci =
		(title: string, placeHolder: string, classList: string[], readonly = false) => {
			const i = ce("input", { classList });
			i.type = "text";
			i.title = title;
			i.placeholder = placeHolder;
			i.readOnly = readonly;
			return i;
		};
	const dot = ce("button", {
		classList: ["todo_dot"],
		innerText: "・"
	});
	const done = ce("button", {
		classList: ["todo_done"],
		innerText: "✔"
	});
	const remove = ce("button", {
		classList: ["todo_remove"],
		innerText: "✘"
	});
	const title = ci("Title", "Title", ["grow", "shrink", "todo_title"]);
	const etime = ci("Elapsed time", "", ["todo_etime"], true);
	const ptime = ci("Predetermined time", "", ["todo_ptime"]);

	const li = ce("li", {
		id: "item-" + itemID,
		classList: ["cH"],
		children: [dot, done, remove, title, etime, ptime]
	});

	dot.addEventListener("click", () => et.dispatchEvent("done-item", { itemID }));
	done.addEventListener("click", () => et.dispatchEvent("undone-item", { itemID }));
	remove.addEventListener("click", () => et.dispatchEvent("remove-item", { itemID }));
	etime.addEventListener("click", () => {
		li.classList.toggle("running");
		if (li.classList.contains("running")) {
			et.dispatchEvent("start-timer", { itemID });
		} else {
			et.dispatchEvent("pause-timer", { itemID });
		}
	});
	ptime.addEventListener("keyup", (e) => {
		if (e.keyCode == 13) {
			const tmp = s2t(ptime.value);
			if (!tmp.success) setPTime2Item(itemID, ptimeMap.get(itemID) || 0);
			else {
				setPTime2Item(itemID, tmp.value);
				et.dispatchEvent("onchange-ptime", { time: tmp.value, itemID });
			}
		}
	});

	ge("todo_ul").appendChild(li);
}

// 本当は、Todo Item をクラス化すべきだが、めんどくさくなったので、これを使って無理やり実装した。
const etimeMap: Map<string, number> = new Map();
const ptimeMap: Map<string, number> = new Map();
function getTotalPtime() {
	let count = 0;
	for (const [k, v] of ptimeMap) count += v;
	return count;
}
function getTotalETime() {
	let count = 0;
	for (const [k, v] of etimeMap) count += v;
	return count;
}
function getPTime(id: string) {
	return ptimeMap.get(id) || 0;
}
function getETime(id: string) {
	return etimeMap.get(id) || 0;
}