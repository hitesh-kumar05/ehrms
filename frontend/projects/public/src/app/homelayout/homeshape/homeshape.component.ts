import {AfterViewInit, Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {gsap} from 'gsap';
import {MotionPathPlugin} from 'gsap/MotionPathPlugin';
import {environment} from "../../../../../environments/environment.dev";

gsap.registerPlugin(MotionPathPlugin)

@Component({
  selector: 'app-homeshape',
  templateUrl: './homeshape.component.html',
  styleUrl: './homeshape.component.scss'
})
export class HomeshapeComponent implements OnInit, AfterViewInit {
  private center = {x: 325, y: 175};
  private serv_dist = 260;
  private circle_radius = 44;
  private text_top_margin = 25;
  private tspan_delta = 30;
  private icon_size = 42;

  private servicesData: any = [
    {name: 'धान उपार्जन', icon: 'paddy.jpg'},
    {name: 'कृषक उन्नति \nयोजना', icon: 'farmer.webp'},
    {name: 'मुख्यमंत्री वृक्षारोपण \nयोजना', icon: 'virksha.png'},
    {name: 'कोदो, कुटकी \nरागी उपार्जन', icon: 'kodo.jfif'},
    {name: 'गन्ना उपार्जन', icon: 'sugercane.webp'},
    {name: 'बागवानी पंजीयन', icon: 'horti.jpg'},
  ];

  private halfCircle = [
    {x: -this.serv_dist, y: 0},
    {x: 0, y: this.serv_dist},
    {x: this.serv_dist, y: 0},
    {x: 0, y: -this.serv_dist},
    {x: -this.serv_dist, y: 0}
  ];

  private pivotPath = {x: this.halfCircle[0].x, y: this.halfCircle[0].y};
  private twnPivotPath = gsap.to(this.pivotPath, {
    duration: 12,
    motionPath: {
      path: this.halfCircle,
      curviness: 1.5
    },
    ease: 'none'
  });

  private twnPointerPath: any;

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.servicesData.forEach((serv: any, index: any) => {
      this.addService(serv, index);
    });
  }

  private createSVGElement(tag: string): SVGElement {
    return this.renderer.createElement(tag, 'svg');
  }

  private setAttributes(el: SVGElement, options: any): void {
    Object.keys(options).forEach(attr => {
      this.renderer.setAttribute(el, attr, options[attr]);
    });
  }

  private addService(serv: any, index: number): void {
    const services = this.el.nativeElement.querySelector('#service-collection');
    const group = this.createSVGElement('g');
    this.renderer.addClass(group, 'service');
    this.renderer.addClass(group, `serv-${index}`);

    const iconGroup = this.createSVGElement('g');
    this.renderer.addClass(iconGroup, 'icon-wrapper');

    const circle = this.createSVGElement('circle');
    this.setAttributes(circle, {
      r: this.circle_radius.toString(),
      cx: this.center.x.toString(),
      cy: this.center.y.toString()
    });

    this.renderer.appendChild(iconGroup, circle);
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${environment.login}assets/image/${serv.icon}`);
    img.setAttribute('width', '150');
    img.setAttribute('height', '70');
    img.setAttribute('x', '250');
    img.setAttribute('y', '140');
    // img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    //
    // const icon = this.renderer.createElement('img');
    // icon.src = "https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/410.svg";
    // icon.style.width = this.icon_size + 'px';
    // icon.style.height = this.icon_size + 'px';
    // icon.style.position = 'absolute';
    // icon.style.left = (this.center.x - this.icon_size / 2) + 'px';
    // icon.style.top = (this.center.y - this.icon_size / 2) + 'px';

    this.renderer.appendChild(iconGroup, img);

    this.renderer.appendChild(group, iconGroup);
    const text = this.createSVGElement('text');
    this.setAttributes(text, {
      x: this.center.x.toString(),
      y: (this.center.y + this.circle_radius + this.text_top_margin).toString(),
      'font-weight': 'bold',
    });


    const tspan = this.createSVGElement('tspan');
    if (serv.name.indexOf('\n') >= 0) {
      const tspan2 = tspan.cloneNode() as SVGElement;
      const [name1, name2] = serv.name.split('\n');
      tspan.textContent = name1;
      tspan2.textContent = name2;
      this.setAttributes(tspan, {
        'font-size': '18'
      })
      this.setAttributes(tspan2, {
        x: this.center.x.toString(),
        dy: this.tspan_delta.toString(),
        'font-size': '18'
      });

      this.renderer.appendChild(text, tspan);
      this.renderer.appendChild(text, tspan2);
    } else {
      tspan.textContent = serv.name;
      this.setAttributes(tspan, {

        'font-size': '18'
      })
      this.renderer.appendChild(text, tspan);
    }

    this.renderer.appendChild(group, text);
    this.renderer.appendChild(services, group);


    const serviceBubble = this.el.nativeElement.querySelector(`.serv-${index}`);
    this.twnPivotPath.progress(index / (this.servicesData.length - 0));
    gsap.set(serviceBubble, {
      x: this.pivotPath.x,
      y: this.pivotPath.y
    });
  }

}
