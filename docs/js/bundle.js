const onLoad = (() => {
    let isLoaded = false;
    let listeners = [];
    window.addEventListener("load", () => {
        isLoaded = true;
        listeners.forEach(listener => {
            listener();
        });
        listeners = [];
    });
    return (listener) => {
        if (isLoaded)
            setTimeout(listener, 0);
        else
            listeners.push(listener);
    };
})();

function ge(id) { return document.getElementById(id); }


function ce(tagName, options) {
    var result = document.createElement(tagName);
    if (options) {
        if (options.id)
            result.id = options.id;
        if (options.classList)
            options.classList.forEach(_ => result.classList.add(_));
        if (options.children)
            options.children.forEach(_ => result.appendChild(_));
        if (options.innerText)
            result.innerText = options.innerText;
    }
    return result;
}

class ETarget {
    constructor(thisObject) {
        this.listeners = new Map();
        this.thisObject = thisObject;
    }
    addEventListener(type, listener, isOnce = false) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).push({ isOnce, listener });
        }
        else {
            this.listeners.set(type, [{ isOnce, listener }]);
        }
    }
    removeEventListener(type, listener) {
        if (!this.listeners.has(type))
            return { count: 0 };
        const listeners = this.listeners.get(type);
        let count = 0;
        for (let i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i].listener == listener) {
                listeners.splice(i, 1);
                count++;
            }
        }
        return { count };
    }
    dispatchEvent(type, event) {
        if (!this.listeners.has(type))
            return { count: 0 };
        const listeners = this.listeners.get(type).slice();
        const count = listeners.length;
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].listener.call(this.thisObject, event);
        }
        const listeners2 = this.listeners.get(type);
        for (let i = listeners2.length - 1; i >= 0; i--) {
            if (listeners2[i].isOnce) {
                listeners2.splice(i, 1);
            }
        }
        return { count };
    }
}

function padLeft(str, len, pad) {
    return pad.charAt(0).repeat(len - str.length) + str;
}

function init() {
    return new Promise(res => {
        onLoad(() => {
            const et = new ETarget(null);
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
function id2li(id) {
    return ge("item-" + id);
}
function id2etime(id) {
    return id2li(id).getElementsByClassName("todo_etime").item(0);
}
function id2ptime(id) {
    return id2li(id).getElementsByClassName("todo_ptime").item(0);
}
function t2s(t, withSec = true) {
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
function s2t(s) {
    const parts = s.split(":").map(_ => parseInt(_));
    if (parts.length > 3 || parts.length < 0 || parts.some(_ => isNaN(_)))
        return { success: false, value: 0 };
    return { success: true, value: parts.reverse().reduce((pv, cv, i) => pv + cv * Math.pow(60, i), 0) };
}
function setProgress(value, total) {
    ge("progress_text").innerText = t2s(value, false) + " / " + t2s(total, false);
    const ratio = total == 0 ? (value == 0 ? 0 : 100) : value / total * 100;
    ge("progress_bar").style.background = `linear-gradient(90deg, #b8e994 ${ratio}%, transparent ${ratio}%)`;
}
function setPTime2Item(itemID, time) {
    ptimeMap.set(itemID, time);
    id2ptime(itemID).value = t2s(time);
}
function setETime2Item(itemID, time) {
    etimeMap.set(itemID, time);
    id2etime(itemID).value = t2s(time);
}
function setStatus2Item(itemID, isDone) {
    ge(isDone ? "done_ul" : "todo_ul").appendChild(id2li(itemID));
}
function addItem(et) {
    return () => {
        const id = performance.now().toString();
        createTodoItem(id, et);
        return id;
    };
}
function removeItem(itemID) {
    id2li(itemID).remove();
    ptimeMap.delete(itemID);
    etimeMap.delete(itemID);
}
function createTodoItem(itemID, et) {
    const ci = (title, placeHolder, classList, readonly = false) => {
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
        }
        else {
            et.dispatchEvent("pause-timer", { itemID });
        }
    });
    ptime.addEventListener("keyup", (e) => {
        if (e.keyCode == 13) {
            const tmp = s2t(ptime.value);
            if (!tmp.success)
                setPTime2Item(itemID, ptimeMap.get(itemID) || 0);
            else {
                setPTime2Item(itemID, tmp.value);
                et.dispatchEvent("onchange-ptime", { time: tmp.value, itemID });
            }
        }
    });
    ge("todo_ul").appendChild(li);
}
const etimeMap = new Map();
const ptimeMap = new Map();
function getTotalPtime() {
    let count = 0;
    for (const [k, v] of ptimeMap)
        count += v;
    return count;
}
function getTotalETime() {
    let count = 0;
    for (const [k, v] of etimeMap)
        count += v;
    return count;
}
function getPTime(id) {
    return ptimeMap.get(id) || 0;
}
function getETime(id) {
    return etimeMap.get(id) || 0;
}

function Init() {
    return Promise.all([
        init()
    ]).then(_ => {
        return _[0];
    });
}

Init().then(ui => {
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
    const timers = new Map();
    ui.et.addEventListener("pause-timer", _ => {
        const id = _.itemID;
        const startTime = performance.now();
        if (timers.has(id)) {
            clearInterval(timers.get(id));
            timers.delete(id);
        }
        else {
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
