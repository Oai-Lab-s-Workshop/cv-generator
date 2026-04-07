import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';

@Injectable({ providedIn: 'root' })
export class PocketBaseService {
  private pb: PocketBase;

  constructor() {
    this.pb = new PocketBase('http://localhost:8090');
  }

  async getCvProfile(slug: string) {
    return await this.pb.collection('cv_profiles').getFirstListItem(`slug="${slug}"`);
  }

  async getPerson(cvProfileId: string) {
    return await this.pb.collection('persons').getFirstListItem(`cv_profile="${cvProfileId}"`);
  }

  async getEmplois(cvProfileId: string) {
    return await this.pb.collection('emplois').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '-date_start'
    });
  }

  async getProjets(cvProfileId: string) {
    return await this.pb.collection('projets').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '-date'
    });
  }

  async getCompetences(cvProfileId: string) {
    return await this.pb.collection('competences').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: 'sort_order'
    });
  }

  async getDiplomes(cvProfileId: string) {
    return await this.pb.collection('diplomes').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '-year'
    });
  }

  async getAllCvProfiles() {
    return await this.pb.collection('cv_profiles').getFullList();
  }
}
