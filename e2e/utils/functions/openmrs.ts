import { Page, expect } from '@playwright/test';
import { O3_URL } from '../configs/globalSetup';

export var userDetails = {
  userName : '',
  givenName : '',
  password : ''
}

export var patientName = {
  firstName : '',
  givenName : '',
  updatedFirstName : ''
}

export var randomOpenMRSRoleName = {
  roleName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
}

export const delay = (mills) => {
  const endTime = Date.now() + mills;
  while (Date.now() < endTime) {
    // Do nothing, just wait
  }
};

export class OpenMRS {
  constructor(readonly page: Page) {}

  readonly patientSearchIcon = () => this.page.locator('[data-testid="searchPatientIcon"]');
  readonly patientSearchBar = () => this.page.locator('[data-testid="patientSearchBar"]');
  readonly createPatientButton = () => this.page.locator('button[type=submit]');

  async open() {
    await this.page.goto(`${O3_URL}`);
    await this.page.locator('#username').fill(`${userDetails.userName}`);
    await this.page.getByRole('button', { name: /continue/i }).click();
    await this.page.locator('#password').fill(`${userDetails.password}`);
    await this.page.locator('button[type="submit"]').click();
    await this.page.getByRole('searchbox', { name: 'Search for a location' }).fill('Cardiology - OPD'), delay(1500);
    await this.page.locator('label').filter({ hasText: /Cardio/ }).locator('span').first().click();
    await this.page.locator('button[type="submit"]').click();
    await this.page.getByRole('button', { name: /mon compte/i }).click();
    await this.page.getByLabel('Modifier la langue').getByRole('button', { name: /modifier/i }).click();
    await this.page.getByRole('group').locator('span').nth(2).click();
    await this.page.getByRole('dialog').getByRole('button', { name: /modifier/i }).click();
    await expect(this.page).toHaveURL(/.*home/);
  }

  async createPatient() {
    patientName = {
      firstName : `e2e_test_${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      givenName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`, 
      updatedFirstName: `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    await this.page.getByRole('button', { name: /add patient/i }).click();
    await expect(this.createPatientButton()).toBeEnabled();
    await this.page.locator('#givenName').fill(`${patientName.firstName}`);
    await this.page.locator('#familyName').fill(`${patientName.givenName}`);
    await this.page.locator('label').filter({ hasText: /^Male$/ }).locator('span').first().click();
    await this.page.locator('div[aria-label="day, "]').fill('16');
    await this.page.locator('div[aria-label="month, "]').fill('08');
    await this.page.locator('div[aria-label="year, "]').fill('2002');
    await this.createPatientButton().click();
    await expect(this.page.getByText(/new patient created/i)).toBeVisible(), delay(3000);;
  }

  async createUser() {
    userDetails = {
      userName : `${Array.from({ length: 5 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`,
      givenName : `${Array.from({ length: 8 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`, 
      password: `Pas1${Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('')}`
    }
    await this.page.goto(`${O3_URL}/openmrs`);
    await this.page.locator('#username').fill(`${process.env.O3_USERNAME}`);
    await this.page.locator('#password').fill(`${process.env.O3_PASSWORD}`), delay(1000);
    await this.page.locator('input[type="submit"]').click();
    await this.page.getByRole('link', { name: /administration/i }).click();
    await this.page.getByRole('link', { name: /manage users/i }).click();
    await this.page.getByRole('link', { name: /add user/i }).click();
    await this.page.locator('#createNewPersonButton').click();
    await this.page.locator('input[name="person\\.names\\[0\\]\\.givenName"]').fill(`${userDetails.givenName}`);
    await this.page.getByRole('radio', { name: 'Female' }).check();
    await this.page.locator('input[name="username"]').fill(`${userDetails.userName}`);
    await this.page.locator('input[name="userFormPassword"]').fill(`${userDetails.password}`);
    await this.page.locator('input[name="confirm"]').fill(`${userDetails.password}`);
    await this.page.getByRole('checkbox', { name: /create a provider account/i }).check();
    await this.page.getByRole('checkbox', { name: /organizational: doctor/i }).check();
    await this.page.getByRole('button', { name: /save user/i }).click();
    await this.page.getByRole('link', { name: /log out/i }).click();
  }

  async searchPatient(searchText: string) {
    await this.navigateToHomePage();
    await this.patientSearchIcon().click();
    await this.patientSearchBar().fill(searchText);
    await this.page.getByRole('link', { name: `${patientName.givenName}` }).first().click();
  }

  async startPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.getByRole('button', { name: /start a visit/i }).click();
    await this.page.locator('label').filter({ hasText: /Cardiologie/ }).locator('span').first().click();
    await this.page.locator('form').getByRole('button', { name: /start visit/i }).click();
    await expect(this.page.getByText(/cardiologie started successfully/i)).toBeVisible(), delay(4000);
  }

  async endPatientVisit() {
    await this.searchPatient(`${patientName.firstName + ' ' + patientName.givenName}`)
    await this.page.getByRole('button', { name: /actions/i, exact: true }).click();
    await this.page.getByRole('menuitem', { name: /end visit/i }).click();
    await this.page.getByRole('button', { name: /danger end Visit/i }).click();
    await expect(this.page.getByText(/visit ended/i)).toBeVisible(), delay(3000);
  }

  async voidPatient() {
    await this.page.goto(`${O3_URL}/openmrs/admin/patients/index.htm`);
    await expect(this.page.getByPlaceholder(' ')).toBeVisible();
    await this.page.getByPlaceholder(' ').type(`${patientName.firstName + ' ' + patientName.givenName}`);
    await this.page.locator('#openmrsSearchTable tbody tr.odd td:nth-child(1)').click();
    await this.page.locator('input[name="voidReason"]').fill('Void patient created by smoke test');
    await this.page.getByRole('button', { name: 'Delete Patient', exact: true }).click();
    await expect(this.page.locator('//*[@id="patientFormVoided"]')).toContainText('This patient has been deleted');
  }

  async voidUser() {
    await this.page.getByRole('link', { name: /administration/i }).click();
    await this.page.getByRole('link', { name: /manage users/i }).click();
    await this.page.getByRole('textbox').fill(`${userDetails.userName}`);
    await this.page.getByRole('button', { name: /search/i }).click(), delay(1500);
    await this.page.getByRole('link', { name: '-' }).click();
    await expect(this.page.locator('input[name="retireReason"]')).toBeVisible();
    await this.page.locator('input[name="retireReason"]').fill('Void user created by smoke test');
    await this.page.getByRole('button', { name: /disable account/i }).click();
    await expect(this.page.getByText('this user account is disabled')).toBeVisible();
  }

  async navigateToHomePage() {
    await this.page.goto(`${O3_URL}/openmrs/spa/home`);
    await expect(this.page).toHaveURL(/.*home/);
  }

  async navigateToLabOrderForm() {
    await this.page.getByLabel(/order basket/i).click(), delay(2000);
    await expect(this.page.locator('text=Lab orders').locator('xpath=../..').locator('button:has-text("Add")')).toBeVisible();
    await this.page.locator('text=Lab orders').locator('xpath=../..').locator('button:has-text("Add")').click();
  }

  async saveLabOrder() {
    await delay(2500), this.page.getByRole('button', { name: /order form/i }).click();
    await this.page.getByRole('button', { name: /save order/i }).click();
    await this.page.getByRole('button', { name: /sign and close/i }).click();
    await expect(this.page.getByText(/placed orders/i)).toBeVisible(), delay(5000);
  }

  async navigateToOrders() {
    await this.page.getByRole('link', { name: /orders/i }).click();
  }

  async logout() {
    await this.page.goto(`${O3_URL}/openmrs`);
    await expect(this.page.getByRole('link', { name: /log out/i })).toBeVisible();
    await this.page.getByRole('link', { name: /log out/i }).click(), delay(4000);
    await expect(this.page.locator('#username')).toBeVisible();
  }
}
