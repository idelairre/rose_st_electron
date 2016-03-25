import { Component, EventEmitter, Inject, Input, Output } from 'ng-forward';
import ChipsSelect from './select/chips-select.component';
import QueryHeader from './header/header';
import inflected from 'inflected';
import moment from 'moment';
import 'reflect-metadata';

// NOTE: divide queries between chart/data types (e.g., composition, trends, comparisons)
// comparison bar charts: make component to make grouped labels
// compositiom doughnut chart: disable grouped labels
// trend line graph: disable grouped labels, enable series

// TODO: the following dimensions: ['ga:week', 'ga:nthWeek', 'ga:dayOfWeek', 'ga:dayOfWeekName', 'ga:dateHour', 'ga:yearMonth', 'ga:yearWeek']

const DATE_FORMAT = 'YYYY-MM-DD';

@Component({
	selector: 'query-builder',
	controllerAs: 'QueryBuilder',
	template: require('./query-builder.html'),
	directives: [ChipsSelect, QueryHeader],
  inputs: ['fields', 'query', 'chartState'],
	outputs: ['onQueryChange']
})

@Inject('$scope')
export default class QueryBuilder {
	@Input() fields;
  @Input() query;
	@Output() onQueryChange
	constructor($scope) {
		this.$scope = $scope;

		this.onQueryChange = new EventEmitter();

		this.state = {
			location: {
				dimensions: ['ga:continent', 'ga:subContinent', 'ga:country', 'ga:region', 'ga:metro', 'ga:city', 'ga:latitude', 'ga:longitude', 'ga:networkDomain', 'ga:networkLocation']
			},
			time: {
				dimensions: ['ga:date', 'ga:year', 'ga:month', 'ga:day', 'ga:hour', 'ga:nthMonth', 'ga:nthDay', 'ga:nthHour']
			},
			users: {
				selected: false,
				metrics: ['ga:users', 'ga:newUsers', 'ga:percentNewSessions', 'ga:1dayUsers', 'ga:7dayUsers', 'ga:14dayUsers', 'ga:30dayUsers', 'ga:sessionsPerUser'],
				dimensions: ['ga:userType', 'ga:sessionCount', 'ga:daysSinceLastSession', 'ga:userDefinedValue']
			},
			sessions: {
				selected: false,
				dimensions: ['ga:sessionDurationBucket'],
				metrics: ['ga:sessions', 'ga:bounces', 'ga:bounceRate', 'ga:sessionDuration', 'ga:avgSessionDuration', 'ga:hits']
			},
			traffic: {
				selected: false,
				dimensions: ['ga:referralPath', 'ga:fullReferrer', 'ga:source', 'ga:medium', 'ga:sourceMedium', 'ga:keyword', 'ga:adContent', 'ga:socialNetwork', 'ga:hasSocialNetworkReferral'],
				metrics: ['ga:organicSearches']
			},
			social: {
				selected: false,
				dimensions: ['ga:socialActivityEndorsingUrl', 'ga:socialActivityDisplayName', 'ga:socialActivityPost', 'ga:socialActivityTimestamp', 'ga:socialActivityUserPhotoUrl', 'ga:socialActivityUserProfileUrl', 'ga:socialActivityContentUrl', 'ga:socialActivityTagsSummary', 'ga:socialActivityAction', 'ga:socialActivityNetworkAction'],
				metrics: ['ga:socialActivities']
			},
			dimensions: [],
			metrics: []
		};
  }

	ngOnInit() {
		this.state.users.selected = true;
		this.startDate = angular.copy(this.fields['start-date']);
		this.endDate = angular.copy(new Date());
		this.fields.dimensions = 'time';
		this.fields.metrics = 'users';
		this.chartState = 'trends';
		this.setField('dimensions');
		this.setField('metrics');
	}

	evalChips() {
		if (this.query.dimensions.includes('ga:hour')) {
			this.headerState.date = false;
			this.headerState.time = true;
		} else if (this.query.dimensions.includes('ga:date') || this.query.dimensions.includes('ga:month') || this.query.dimensions.includes('ga:day')) {
			this.headerState.date = true;
			this.headerState.time = false;
		}
	}

	inflect(item, argument) {
		return inflected[argument](item);
	}

	renderUiName(item) {
		return inflected.humanize(inflected.underscore(item.replace(/(\d+)/, '$1 ').replace(/ga:/, '')));
	}

	resetState() {
		Object.keys(this.state).map((value, index) => {
			if (typeof this.state[value].selected !== 'undefined') {
				this.state[value].selected = false;
			}
		});
	}

	setChartState(event, state) {
		event.preventDefault();
		this.chartState = state;
	}

	setField(field) {
		let category = this.fields[field];
		this.state[field] = this.state[category][field];
	}

	openMenu($mdOpenMenu, event) {
		event.preventDefault();
		$mdOpenMenu(event);
	}
}
