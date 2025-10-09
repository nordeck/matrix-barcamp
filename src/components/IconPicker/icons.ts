/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { sample } from 'lodash';
import {
  faCoffee,
  faLemon,
  faCarrot,
  faSeedling,
  faLeaf,
  faHippo,
  faFish,
  faCrow,
  faFrog,
  faDog,
  faCat,
  faHorse,
  faSun,
  faMoon,
  faStar,
  faUsers,
  faBrain,
  faNewspaper,
  faCheese,
  faChess,
  faCookie,
  faCouch,
  faCar,
  faCompass,
  faFire,
  faPizzaSlice,
  faBeerMugEmpty,
  faComment,
  faServer,
  faFaceSurprise,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export const iconSet: IconDefinition[] = [
  faCoffee,
  faLemon,
  faCarrot,
  faSeedling,
  faLeaf,
  faHippo,
  faFish,
  faCrow,
  faFrog,
  faDog,
  faCat,
  faHorse,
  faSun,
  faMoon,
  faStar,
  faUsers,
  faBrain,
  faNewspaper,
  faCheese,
  faChess,
  faCookie,
  faCouch,
  faCar,
  faCompass,
  faFire,
  faPizzaSlice,
  faBeerMugEmpty,
  faComment,
  faServer,
  faFaceSurprise,
];

// Map of icon names to IconDefinition objects
const iconMap: Record<string, IconDefinition> = {
  coffee: faCoffee,
  lemon: faLemon,
  carrot: faCarrot,
  seedling: faSeedling,
  leaf: faLeaf,
  hippo: faHippo,
  fish: faFish,
  crow: faCrow,
  frog: faFrog,
  dog: faDog,
  cat: faCat,
  horse: faHorse,
  sun: faSun,
  moon: faMoon,
  star: faStar,
  users: faUsers,
  brain: faBrain,
  newspaper: faNewspaper,
  cheese: faCheese,
  chess: faChess,
  cookie: faCookie,
  couch: faCouch,
  car: faCar,
  compass: faCompass,
  fire: faFire,
  'pizza-slice': faPizzaSlice,
  'beer-mug-empty': faBeerMugEmpty,
  comment: faComment,
  server: faServer,
  'face-surprise': faFaceSurprise,
};

/**
 * Convert an icon name (string) to an IconDefinition object
 */
export function getIconByName(iconName: string): IconDefinition {
  const icon = iconMap[iconName];
  if (!icon) {
    // Return a default icon if the name is not found
    console.warn(`Icon "${iconName}" not found, using coffee as fallback`);
    return faCoffee;
  }
  return icon;
}

/**
 * Convert an IconDefinition object to an icon name (string)
 */
export function getIconName(icon: IconDefinition): string {
  return icon.iconName;
}

export function randomIcon(): IconDefinition {
  const icon = sample(iconSet);

  if (!icon) {
    throw Error('icon is undefined in randomIcon');
  }

  return icon;
}
