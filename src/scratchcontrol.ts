import * as $ from "jquery";
import * as OT from "@terrencecrowley/ot-js";
import * as OTE from "@terrencecrowley/ot-editutil";
import * as CS from "./clientsession";

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
	editUtil: OTE.OTEditUtil;
	textValue: string;
	selectionStart: number;
	selectionEnd: number;
	elTextArea: any;

	constructor(ctx: OT.IExecutionContext, cs: CS.ClientSession, reRender: () => void)
	{
		this.context = ctx;
		this.reRender = reRender;
		this.textValue = '';
		this.selectionStart = 0;
		this.selectionEnd = 0;
		this.elTextArea = null;
		this.captureElementCB = this.captureElementCB.bind(this);
		this.notifyChange = this.notifyChange.bind(this);
		this.notifyLocalChange = this.notifyLocalChange.bind(this);
		this.notifyJoin = this.notifyJoin.bind(this);
		this.clientSession = cs;
		cs.onChange('text', this.notifyChange);
		cs.onJoin('text', this.notifyJoin);
		this.editUtil = null;
	}

	notifyChange(cs: CS.ClientSession, a: any): void
		{
			let s: string = a as string;
			if (s)
			{
				let cursor: any = this.editUtil.extractCursor(cs.clientEngine.stateLocal);
				cursor = cursor ? cursor[cs.clientID] : undefined;
				let ss: number = cursor && cursor.selectionStart ? cursor.selectionStart : undefined;
				let se: number = cursor && cursor.selectionEnd ? cursor.selectionEnd : ss;
				this.setTextValue(s, ss, se);
			}
		}

	notifyJoin(cs: CS.ClientSession): void
		{
			if (cs.clientEngine)
				this.editUtil = new OTE.OTEditUtil(this.context, cs.sessionID, cs.clientID, 'text');
			else
				this.editUtil = null;
		}

	setTextValue(s: string, selectionStart?: number, selectionEnd?: number): void
        {
            this.textValue = s;
            if (selectionStart !== undefined)
                this.selectionStart = selectionStart;
            if (selectionEnd !== undefined)
                this.selectionEnd = selectionEnd;
            if (this.elTextArea.value !== this.textValue
                || this.elTextArea.selectionStart != this.selectionStart
                || this.elTextArea.selectionEnd != this.selectionEnd)
            {
                this.elTextArea.value = s;
                selectRange(this.elTextArea, this.selectionStart, this.selectionEnd);
				this.reRender();
            }
        }

	notifyLocalChange(sNewVal: string, s: number, e: number): void
	{
		if (this.clientSession.clientEngine)
		{
			let objOld: any = this.clientSession.clientEngine.toValue();
			let sOldVal = (objOld && objOld['text']) ? objOld['text'] : '';
			if (sOldVal != sNewVal || s != this.selectionStart || e != this.selectionEnd)
			{
				let edit: OT.OTCompositeResource = this.editUtil.computeEdit(sOldVal, sNewVal);
				this.editUtil.injectCursor(edit, s, e);
				if (edit.length > 0)
					this.clientSession.clientEngine.addLocal(edit);
			}
		}
		this.setTextValue(sNewVal, s, e);
	}

	captureElementCB(el: any): void
		{
			this.elTextArea = el;
		}
}
