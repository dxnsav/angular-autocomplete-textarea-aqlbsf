import {
  Component,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  ElementRef,
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
        name: '{name}',
      },
      {
        name: '{id}',
      },
      {
        name: '{email}',
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
      this.closeMenu();
      console.log(false);
      return;
    }

    const query = textBeforeCaret.slice(triggerIdx + 1);
    this.makeOptions(query);

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
      this.renderMenu();
      console.log(true);
    }, 0);
  }

  onKeyDown(ev) {
    let keyCaught = false;
    if (this.triggerIdx !== undefined) {
      switch (ev.key) {
        case 'ArrowDown':
          this.active = Math.min(this.active + 1, this.options.length - 1);
          this.renderMenu();
          console.log('down');
          keyCaught = true;
          break;
        case 'ArrowUp':
          this.active = Math.max(this.active - 1, 0);
          this.renderMenu();
          console.log('up');
          keyCaught = true;
          break;
        case 'Enter':
        case 'Tab':
          this.selectItem(this.active)();
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
    const li = document.createElement('li');
    document.body.appendChild(li);

    const style = li.style;
    const computed = getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    style.wordWrap = 'break-word';
    style.position = 'absolute';
    style.visibility = 'hidden';

    if (this.isFirefox) {
      if (element.scrollHeight > parseInt(computed.height))
        style.overflowY = 'scroll';
    } else {
      style.overflow = 'hidden';
    }

    li.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    li.appendChild(span);

    const coordinates = {
      top: span.offsetTop + parseInt(computed['borderTopWidth']),
      left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
      // height: parseInt(computed['lineHeight'])
      height: span.offsetHeight,
    };

    li.remove();

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

    console.log(this.menuRef);

    this.options.forEach((option, idx) => {
      this.menuRef.nativeElement.appendChild(
        this.menuItemFn(option, this.selectItem(idx), this.active === idx)
      );
    });

    console.log(this.options);

    this.menuRef.nativeElement.hidden = false;
  }

  menuItemFn = (item, setItem, selected) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.classList.add('menu-item');
    if (selected) {
      li.classList.add('selected');
      li.setAttribute('aria-selected', '');
      li.style.backgroundColor = 'slateGray';
      li.style.color = 'white';
    }
    li.textContent = this.trimBrackets(item.name);
    li.onclick = setItem;
    return li;
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

  replaceFn = (item, trigger) => `${trigger}${item.name}`;
  resolveFn = (prefix) =>
    prefix === ''
      ? this.items
      : this.items.filter((item) => item.name.startsWith(prefix));

  closeMenu() {
    setTimeout(() => {
      this.options = [];
      this.left = undefined;
      this.top = undefined;
      this.triggerIdx = undefined;
      this.renderMenu();
    }, 0);
  }

  async makeOptions(query) {
    const options = await this.resolveFn(query);
    if (options.lenght !== 0) {
      this.options = options;
      this.renderMenu();
    } else {
      this.closeMenu();
    }
  }

  trimBrackets(word) {
    return word.charAt(0) === '{' && word.charAt(word.length - 1) === '}'
      ? word.substring(1, word.length - 1)
      : word;
  }
}
