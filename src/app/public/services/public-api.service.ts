import { Injectable } from "@angular/core";
import { BaseHttpApiService } from "../../common/services/base-http-api.service";
import { SessionService } from "../../common/services/session.service";
import { AppConfigService } from "../../common/app-config.service";
import { MessageService } from "../../common/services/message.service";
import {
	PublicApiBadgeAssertionWithBadgeClass,
	PublicApiBadgeClass,
	PublicApiBadgeClassWithIssuer,
	PublicApiBadgeCollectionWithBadgeClassAndIssuer,
	PublicApiIssuer
} from "../models/public-api.model";
import { stripQueryParamsFromUrl } from "../../common/util/url-util";
import { HttpClient } from "@angular/common/http";


@Injectable()
export class PublicApiService extends BaseHttpApiService {
	constructor(
		protected loginService: SessionService,
		protected http: HttpClient,
		protected configService: AppConfigService,
		protected messageService: MessageService
	) {
		super(loginService, http, configService, messageService);
	}

	getBadgeAssertion(
		assertionId: string
	) {
		const url = assertionId.startsWith("http")
			? assertionId
			: `/public/assertions/${assertionId}.json?v=2_0&expand=badge&expand=badge.issuer`;

		return this.get<PublicApiBadgeAssertionWithBadgeClass>(url, null, false, false)
			.then(r => r.body)
			.then(
				assertion => typeof(assertion.badge) === "string"
					? this.getBadgeClass(assertion.badge).then(badge => ({... assertion, badge }))
					: assertion
			);
	}

	getBadgeClass(
		badgeId: string
	): Promise<PublicApiBadgeClassWithIssuer> {
		const url = badgeId.startsWith("http")
			? badgeId
			: `/public/badges/${badgeId}?v=2_0&expand=issuer`;

		return this.get<PublicApiBadgeClassWithIssuer>(url, null, false, false)
			.then(r => r.body)
			.then(
				badge => typeof(badge.issuer) === "string"
					? this.getIssuer(badge.issuer).then(issuer => ({... badge, issuer }))
					: badge
			);
	}

	getIssuer(
		issuerId: string
	): Promise<PublicApiIssuer> {
		const url = issuerId.startsWith("http")
			? issuerId
			: `/public/issuers/${issuerId}`;

		return this.get<PublicApiIssuer>(url, null, false, false)
			.then(r => r.body);
	}

	getIssuerBadges(
		issuerId: string
	): Promise<PublicApiBadgeClass[]> {
		const url = issuerId.startsWith("http")
			? stripQueryParamsFromUrl(issuerId) + "/badges"
			: `/public/issuers/${issuerId}/badges`;

		return this.get<PublicApiBadgeClass[]>(url, null, false, false)
			.then(r => r.body);
	}

	getIssuerWithBadges(
		issuerId: string
	): Promise<{issuer: PublicApiIssuer; badges: PublicApiBadgeClass[]}> {
		return Promise.all([
			this.getIssuer(issuerId),
			this.getIssuerBadges(issuerId)
		]).then(([issuer, badges]) => ({ issuer, badges }))
	}

	getBadgeCollection(
		shareHash: string
	): Promise<PublicApiBadgeCollectionWithBadgeClassAndIssuer> {
		return this.get<PublicApiBadgeCollectionWithBadgeClassAndIssuer>(`/public/collections/${shareHash}.json?v=2_0&expand=badges.badge&expand=badges.badge.issuer`, null, false, false)
			.then(r => r.body);
	}
}
