import * as React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Title, Button, Icon, IconObject, ObjectName, Label } from 'Component';
import { I, translate, UtilObject, UtilData, UtilSpace, UtilFile, UtilCommon } from 'Lib';
import { popupStore, blockStore, dbStore, authStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 28;
const LIMIT_HEIGHT = 12;

const MenuSyncStatus = observer(class MenuSyncStatus extends React.Component<I.Menu, {}> {

	cache: any = {};
	items: any[] = [];

	constructor (props: I.Menu) {
		super(props);

		this.onPanelIconClick = this.onPanelIconClick.bind(this);
	};

	render () {
		const items = this.getItems();
		const icons = this.getIcons();

		const PanelIcon = (item) => {
			const { id, status } = item;

			return (
				<div className={[ 'iconWrapper', status ? status : ''].join(' ')} onClick={e => this.onPanelIconClick(e, item)}>
					<Icon className={id} />
				</div>
			);
		};

		const Item = (item: any) => {
			return (
				<div
					id={'item-' + item.id}
					className="item sides"
				>
					<div className="side left">
						<IconObject object={item} size={20} />
						<div className="info">
							<ObjectName object={item} />
							<span className="size">{UtilFile.size(item.sizeInBytes)}</span>
						</div>
					</div>
					<div className="side right">
						<Icon className={'ok'} />
					</div>
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			const item = items[index];

			let content = null;
			if (item.isSection) {
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>{translate(UtilCommon.toCamelCase([ 'common', item.id ].join('-')))}</div>;
			} else {
				content = (
					<div className="row" style={style}>
						<Item {...item} index={index} />
					</div>
				);
			};

			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<React.Fragment>
				<div className="syncPanel">
					<Title text={translate('menuSyncStatusTitle')} />

					<div className="icons">
						{icons.map((icon, idx) => <PanelIcon key={idx} {...icon} />)}
					</div>
				</div>

				{this.cache && items.length ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
							loadMoreRows={() => { return; }}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											scrollToAlignment="center"
											overscanRowCount={20}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	onPanelIconClick (e, item) {
		console.log('ITEM: ', item);
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemLayouts() },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.In, value: UtilObject.getFileLayouts() }
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		UtilData.search({
			filters,
			sorts,
			fullText: '',
			offset: 0,
			limit: 30,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			this.items = this.items.concat(message.records || []);
			this.forceUpdate();
		});
	};

	getItems () {
		let items = this.items.slice();

		items = UtilCommon.groupDateSections(items, 'createdDate');

		return items;
	};

	getIcons () {
		const icons = [
			{ id: 'network', status: 'connected', message: translate('menuSyncStatusNetworkMessageE2EE') },
			{ id: 'p2p', message: translate('menuSyncStatusNetworkMessageE2EE') },
		];

		return icons;
	};

	getRowHeight (item: any) {
		return item && item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

});

export default MenuSyncStatus;
