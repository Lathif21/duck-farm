// Success toasts (06: Alerts). One at a time; disappears after 3 s.
let message = $state<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = {
	get message() {
		return message;
	},
	show(text: string) {
		message = text;
		clearTimeout(timer);
		timer = setTimeout(() => (message = null), 3000);
	}
};
