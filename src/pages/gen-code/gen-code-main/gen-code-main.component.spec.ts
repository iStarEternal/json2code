import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenCodeMainComponent } from './gen-code-main.component';

describe('GenCodeMainComponent', () => {
  let component: GenCodeMainComponent;
  let fixture: ComponentFixture<GenCodeMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenCodeMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenCodeMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
