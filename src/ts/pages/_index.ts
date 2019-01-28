import * as page_main from "./main";

export type InitResult = page_main.InitResult;

export function Init() {
	return Promise.all([
		page_main.init()
	]).then(_ => {
		return _[0];
	});
}