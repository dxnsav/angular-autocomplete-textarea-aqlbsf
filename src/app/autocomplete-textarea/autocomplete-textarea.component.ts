import {
  Component,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  ElementRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'app-autocomplete-textarea',
  templateUrl: './autocomplete-textarea.component.html',
  styleUrls: ['./autocomplete-textarea.component.css'],
})
export class AutocompleteTextareaComponent implements OnInit {
  divInput;
  divList;
  isTagging: boolean = false;
  tagValue: string = '';
  items;
  filteredItems;

  active;
  top;
  left;
  triggerIdx;

  isFirefox;
  options;

  componentRef: any;
  @ViewChild('textarea') textarea: ElementRef;
  @ViewChild('list') menuRef: ElementRef;

  constructor(public resolver: ComponentFactoryResolver) {}

  ngOnInit() {
    this.items = [
      {
        id: 1,
        name: '${name}',
      },
      {
        id: 2,
        name: '${surname}',
      },
      {
        id: 3,
        name: '${email}',
      },
    ];

    this.filteredItems = this.items;
    this.isFirefox =
      typeof window !== 'undefined' && window['mozInnerScreenX'] != null;
    this.options = [];
  }

  @HostListener('input', ['$event'])
  onInputStart(event: Event) {
    this.onInput();
  }

  @HostListener('keydown', ['$event'])
  onKeyDownStart(event: Event) {
    this.onKeyDown(event);
  }

  onInput() {
    const positionIndex = this.textarea.nativeElement.selectionStart;
    const textBeforeCaret = this.textarea.nativeElement.value.slice(
      0,
      positionIndex
    );
    const tokens = textBeforeCaret.split(/\s/);
    const lastToken = tokens[tokens.length - 1];
    const triggerIdx = textBeforeCaret.endsWith(lastToken)
      ? textBeforeCaret.length - lastToken.length
      : -1;
    const maybeTrigger = textBeforeCaret[triggerIdx];
    const keystrokeTriggered = maybeTrigger === '$';

    if (!keystrokeTriggered) {
      //this.closeMenu()
      console.log(false);
      return;
    }

    const query = textBeforeCaret.slice(triggerIdx + 1);
    //this.makeOptions(query)

    const coords = this.getCaretCoordinates(
      this.textarea.nativeElement,
      positionIndex
    );
    const { top, left } = this.textarea.nativeElement.getBoundingClientRect();

    setTimeout(() => {
      this.active = 0;
      this.left =
        window.scrollX +
        coords.left +
        left +
        this.textarea.nativeElement.scrollLeft;
      this.top =
        window.scrollY +
        coords.top +
        top +
        coords.height -
        this.textarea.nativeElement.scrollTop;
      this.triggerIdx = triggerIdx;
      //this.renderMenu()
      console.log(true);
    }, 0);
  }

  onKeyDown(ev) {
    let keyCaught = false;
    if (this.triggerIdx !== undefined) {
      switch (ev.key) {
        case 'ArrowDown':
          this.active = Math.min(this.active + 1, this.options.length - 1);
          //this.renderMenu()
          console.log('down');
          keyCaught = true;
          break;
        case 'ArrowUp':
          this.active = Math.max(this.active - 1, 0);
          //this.renderMenu()
          console.log('up');
          keyCaught = true;
          break;
        case 'Enter':
        case 'Tab':
          //this.selectItem(this.active)()
          console.log('entub');
          keyCaught = true;
          break;
      }
    }

    if (keyCaught) {
      ev.preventDefault();
    }
  }

  getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const style = div.style;
    const computed = getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    style.wordWrap = 'break-word';
    style.position = 'absolute';
    style.visibility = 'hidden';

    /*properties.forEach(prop => {
      style[prop] = computed[prop]
    })/** */

    if (this.isFirefox) {
      if (element.scrollHeight > parseInt(computed.height))
        style.overflowY = 'scroll';
    } else {
      style.overflow = 'hidden';
    }

    div.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
      top: span.offsetTop + parseInt(computed['borderTopWidth']),
      left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
      // height: parseInt(computed['lineHeight'])
      height: span.offsetHeight,
    };

    div.remove();

    return coordinates;
  }

  renderMenu() {
    if (this.top === undefined) {
      this.menuRef.nativeElement.hidden = true;
      return;
    }

    this.menuRef.nativeElement.style.left = this.left + 'px';
    this.menuRef.nativeElement.style.top = this.top + 'px';
    this.menuRef.nativeElement.innerHTML = '';

    this.options.forEach((option, idx) => {
      this.menuRef.nativeElement.appendChild(
        this.menuItemFn(option, this.selectItem(idx), this.active === idx)
      );
    });

    this.menuRef.nativeElement.hidden = false;
  }

  menuItemFn = (user, setItem, selected) => {
    const div = document.createElement('div');
    div.setAttribute('role', 'option');
    div.className = 'menu-item';
    if (selected) {
      div.classList.add('selected');
      div.setAttribute('aria-selected', '');
    }
    div.textContent = user.username;
    div.onclick = setItem;
    return div;
  };

  selectItem(active) {
    return () => {
      const preMention = this.textarea.nativeElement.value.substr(
        0,
        this.triggerIdx
      );
      const option = this.options[active];
      const mention = this.replaceFn(
        option,
        this.textarea.nativeElement.value[this.triggerIdx]
      );
      const postMention = this.textarea.nativeElement.value.substr(
        this.textarea.nativeElement.selectionStart
      );
      const newValue = `${preMention}${mention}${postMention}`;
      this.textarea.nativeElement.value = newValue;
      const caretPosition =
        this.textarea.nativeElement.value.length - postMention.length;
      this.textarea.nativeElement.setSelectionRange(
        caretPosition,
        caretPosition
      );
      this.closeMenu();
      this.textarea.nativeElement.focus();
    };
  }

  replaceFn = (user, trigger) => `${trigger}${user.username}`;

  closeMenu() {
    setTimeout(() => {
      this.options = [];
      this.left = undefined;
      this.top = undefined;
      this.triggerIdx = undefined;
      this.renderMenu();
    }, 0);
  }
}
