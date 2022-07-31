/* eslint-disable no-restricted-syntax */
import { test, expect } from '@playwright/test';

const people = ['Alice', 'Bob', 'Charlie'];
for (const name of people) {
  test(`testing with ${name}`, async () => {
    expect(false).toBeTruthy();
  });
}
