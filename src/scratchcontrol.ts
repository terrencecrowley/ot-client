import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as CS from "@terrencecrowley/ot-clientsession";
import * as ClientActions from "./clientactions";

// Helper function for setting range of a textarea.
function selectRange(el: any, start: any, end: any) {
        if('selectionStart' in el) {
            el.selectionStart = start;
            el.selectionEnd = end;
        } else if(el.setSelectionRange) {
            el.setSelectionRange(start, end);
        } else if(el.createTextRange) {
            let range: any = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    }

export class ScratchControl
{
	context: OT.IExecutionContext;
	clientSession: CS.ClientSession;
	reRender: () => void;
	actions: ClientActions.IClientActions;

	editUtil: OTE.OTEditUtil;
	textValue: string;
	selectionStart: number;
	selectionEnd: number;
	elTextArea: any;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void, actions: ClientActions.IClientActions)
	{
		this.context = ctx;
		this.reRender = reRender;
		this.actions = actions;

		this.textValue = '';
		this.selectionStart = 0;
		this.selectionEnd = 0;
		this.elTextArea = null;
		this.captureElementCB = this.captureElementCB.bind(this);
		this.handleState = this.handleState.bind(this);
		this.notifyLocalChange = this.notifyLocalChange.bind(this);
		this.handleJoin = this.handleJoin.bind(this);
		this.clientSession = cs;
		cs.on('state', this.handleState);
		cs.on('join', this.handleJoin);
		this.editUtil = null;
	}

	reset(): void
		{
			this.textValue = '';
			this.selectionStart = 0;
			this.selectionEnd = 0;
		}

	doneEdits(ok: boolean): void
		{
		}

	handleState(cs: CS.ClientSession, css: CS.ClientSessionState): void
		{
			if (css == null || css.state == null || css.state['text'] == null)
				this.reset();
			else
			{
				let s: string = css.state['text'] as string;
				if (s)
				{
					let cursor: any = this.editUtil.extractCursor(css.clientEngine.stateLocal);
					cursor = cursor ? cursor[cs.session.clientID] : undefined;
					let ss: number = cursor && cursor.selectionStart ? cursor.selectionStart : undefined;
					let se: number = cursor && cursor.selectionEnd ? cursor.selectionEnd : ss;
					this.setTextValue(s, ss, se);
				}
			}
		}

	handleJoin(cs: CS.ClientSession, css: CS.ClientSessionState): void
		{
			if (css && css.clientEngine)
				this.editUtil = new OTE.OTEditUtil(this.context, css.sessionID, css.clientID, 'text');
			else
				this.editUtil = null;
		}

	pushIntoTextArea(): void
		{
			if (this.elTextArea)
			{
				if (this.elTextArea.value !== this.textValue
					|| this.elTextArea.selectionStart != this.selectionStart
					|| this.elTextArea.selectionEnd != this.selectionEnd)
				{
					this.elTextArea.value = this.textValue;
					selectRange(this.elTextArea, this.selectionStart, this.selectionEnd);
					this.reRender();
				}
            }
		}

	setTextValue(s: string, selectionStart?: number, selectionEnd?: number): void
        {
            this.textValue = s;
            if (selectionStart !== undefined)
                this.selectionStart = selectionStart;
            if (selectionEnd !== undefined)
                this.selectionEnd = selectionEnd;
			this.pushIntoTextArea();
        }

	notifyLocalChange(sNewVal: string, s: number, e: number): void
	{
		let css: CS.ClientSessionState = this.clientSession.session;

		if (css.clientEngine)
		{
			let objOld: any = css.clientEngine.toValue();
			let sOldVal = (objOld && objOld['text']) ? objOld['text'] : '';
			if (sOldVal != sNewVal || s != this.selectionStart || e != this.selectionEnd)
			{
				let edit: OT.OTCompositeResource = this.editUtil.computeEdit(sOldVal, sNewVal);
				this.editUtil.injectCursor(edit, s, e);
				if (edit.length > 0)
					css.addLocal(edit);
			}
		}
		this.setTextValue(sNewVal, s, e);
	}

	captureElementCB(el: any): void
		{
			this.elTextArea = el;
			this.pushIntoTextArea();
		}
}
