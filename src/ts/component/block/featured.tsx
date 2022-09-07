import * as React from 'react';
import { I, C, DataUtil, Util, focus, analytics, Relation, translate } from 'Lib';
import { Cell } from 'Component';
import { blockStore, detailStore, dbStore, menuStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const PREFIX = 'blockFeatured';
const BLOCK_ID_DATAVIEW = 'dataview';
const SOURCE_LIMIT = 1;

const BlockFeatured = observer(class BlockFeatured extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	cellRefs: Map<string, any> = new Map();
	menuContext: any = null;
	setId: string = '';

	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onType = this.onType.bind(this);
		this.onTypeOver = this.onTypeOver.bind(this);
		this.onTypeSelect = this.onTypeSelect.bind(this);
		this.onSource = this.onSource.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.elementMapper = this.elementMapper.bind(this);
	};

	render () {
		const { rootId, block, iconSize, isPopup, readonly } = this.props;
		const storeId = this.getStoreId();
		const object = detailStore.get(rootId, storeId, [ 
			Constant.relationKey.featured, 
			Constant.relationKey.space, 
			Constant.relationKey.setOf, 
		]);
		const items = this.getItems();
		const type = dbStore.getType(object.type);
		const bullet = <div className="bullet" />;
		const allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);

		let types = Relation.getSetOfObjects(rootId, storeId, Constant.typeId.type).map(it => it.name);
		let relations = Relation.getSetOfObjects(rootId, storeId, Constant.typeId.relation).map(it => it.name);
		let setOfString = [];
		let tl = types.length;
		let rl = relations.length;

		if (tl) {
			types = types.slice(0, SOURCE_LIMIT);
			setOfString.push(`Object ${Util.cntWord(tl, 'type', 'types')}: ${types.join(', ')}`);

			if (tl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{tl - SOURCE_LIMIT}</div>);
			};
		};
		if (rl) {
			relations = relations.slice(0, SOURCE_LIMIT);
			setOfString.push(`${Util.cntWord(rl, 'Relation', 'Relations')}: ${relations.join(', ')}`);

			if (rl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{rl - SOURCE_LIMIT}</div>);
			};
		};

		return (
			<div className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
				<span className="cell canEdit first">
					<div 
						id={Relation.cellId(PREFIX, Constant.relationKey.type, 0)} 
						className="cellContent type"
						onClick={this.onType}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, Constant.relationKey.type); }}
						onMouseLeave={this.onMouseLeave}
					>
						<div className="name">{type ? Util.shorten(type.name, 32) : translate('commonDeletedType')}</div>
					</div>
				</span>

				{object.layout == I.ObjectLayout.Set ? (
					<span className={[ 'cell', (!readonly ? 'canEdit' : '') ].join(' ')}>
						{bullet}
						<div 
							id={Relation.cellId(PREFIX, Constant.relationKey.setOf, 0)} 
							className="cellContent setOf"
							onClick={this.onSource}
							onMouseEnter={(e: any) => { this.onMouseEnter(e, Constant.relationKey.setOf); }}
							onMouseLeave={this.onMouseLeave}
						>
							{setOfString.length ? (
								<div className="name">
									{setOfString.map((it: any, i: number) => (
										<span key={i}>{it}</span>
									))}
								</div>
							) : (
								<div className="empty">Source</div>
							)}
						</div>
					</span>
				) : ''}

				{items.map((relationKey: any, i: any) => {
					const id = Relation.cellId(PREFIX + block.id, relationKey, 0);
					const relation = dbStore.getRelationByKey(relationKey);
					const canEdit = !readonly && allowedValue && !relation.isReadonlyValue;
					const cn = [ 'cell', (canEdit ? 'canEdit' : '') ];
					const record = detailStore.get(rootId, storeId, [ relationKey ]);
					const check = Relation.checkRelationValue(relation, record[relationKey]);

					if (!check && !canEdit) {
						return null;
					};

					if (i == items.length - 1) {
						cn.push('last');
					};

					return (
						<React.Fragment key={i}>
							{bullet}
							<span 
								className={cn.join(' ')} 
								onClick={(e: any) => { 
									e.persist(); 
									this.onRelation(e, relationKey); 
								}}
							>
								<Cell 
									ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
									elementId={id}
									rootId={rootId}
									subId={rootId}
									block={block}
									relationKey={relationKey}
									getRecord={() => { return record; }}
									viewType={I.ViewType.Grid}
									index={0}
									bodyContainer={Util.getBodyContainer(isPopup ? 'popup' : 'page')}
									pageContainer={Util.getCellContainer(isPopup ? 'popup' : 'page')}
									iconSize={iconSize}
									readonly={!canEdit}
									isInline={true}
									idPrefix={PREFIX + block.id}
									elementMapper={this.elementMapper}
									showTooltip={true}
									tooltipX={I.MenuDirection.Left}
									arrayLimit={2}
									textLimit={150}
									onMouseLeave={this.onMouseLeave}
								/>
							</span>
						</React.Fragment>
					);
				})}
			</div>
		);
	};
	
	componentDidMount () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.setOf ]);
		const setOf = Relation.getArrayValue(object[Constant.relationKey.setOf]);

		this._isMounted = true;

		if ((object.layout == I.ObjectLayout.Set) && !setOf.length) {
			window.setTimeout(() => { this.onSource(); }, Constant.delay.menu);
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};

	getItems () {
		const { rootId } = this.props;
		const storeId = this.getStoreId();
		const object = detailStore.get(rootId, storeId);
		const skipIds = [ 
			Constant.relationKey.type, 
			Constant.relationKey.description,
			Constant.relationKey.setOf, 
		];

		return (object[Constant.relationKey.featured] || []).filter((it: any) => {
			const relation = dbStore.getRelationByKey(it);
			if (!relation) {
				return false;
			};
			if (skipIds.indexOf(it) >=  0) {
				return false;
			};
			if (relation.format == I.RelationType.Checkbox) {
				return true;
			};
			return true;
		});
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;
		
		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || relation.isReadonlyValue) {
			return;
		};

		const id = Relation.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onMouseEnter (e: any, relationKey: string) {
		const cell = $('#' + Relation.cellId(PREFIX, relationKey, 0));
		const relation = dbStore.getRelationByKey(relationKey);

		if (relation) {
			Util.tooltipShow(relation.name, cell, I.MenuDirection.Center, I.MenuDirection.Top);
		};
	};

	onMouseLeave (e: any) {
		Util.tooltipHide(false);
	};

	onType (e: any) {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, readonly } = this.props;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.setOf ]);
		const type = detailStore.get(rootId, object.type, []);
		const allowed = ![ Constant.typeId.bookmark ].includes(object.type) && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Type ]);
		const options: any[] = [];
		
		if (!type.isArchived && !type.isDeleted) {
			options.push({ id: 'open', name: 'Open type' });
		};

		if (!readonly && allowed) {
			options.push({ id: 'change', name: 'Change type', arrow: true });
		};

		const showMenu = () => {
			menuStore.open('select', { 
				element: `#block-${block.id} #${Relation.cellId(PREFIX, Constant.relationKey.type, 0)}`,
				offsetY: 8,
				subIds: Constant.menuIds.featuredType,
				onOpen: (context: any) => {
					this.menuContext = context;
				},
				data: {
					options: options,
					noClose: true,
					onOver: this.onTypeOver,
					onSelect: (e: any, item: any) => {
						this.onTypeSelect(e, item);
					},
				},
			});
		};

		DataUtil.checkSetCnt([ object.type ], (message: any) => {
			if (message.records.length == 1) {
				this.setId = message.records[0].id;
				options.push({ id: 'setOpen', name: 'Open set' });
			} else 
			if (message.records.length == 2) {
				options.push({ id: 'setOpenMenu', name: 'Open set', arrow: true });
			} else 
			if (!type._empty_ && !type.isDeleted) {
				options.push({ id: 'setCreate', name: 'Create set' });
			};

			showMenu();
		});
	};

	onTypeOver (e: any, item: any) {
		const { rootId, block } = this.props;

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.featuredType);
			return;
		};

		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.setOf ]);
		const types = DataUtil.getObjectTypesForNewObject().map(it => it.id);

		let menuId = '';
		let menuParam = {
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId: rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'change':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					placeholder: 'Change object type',
					placeholderFocus: 'Change object type',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: types }
					],
					onSelect: (item: any) => {
						C.ObjectSetObjectType(rootId, item.id);
						this.menuContext.close();

						analytics.event('ChangeObjectType', { objectType: item.id });
					},
					dataSort: (c1: any, c2: any) => {
						let i1 = types.indexOf(c1.id);
						let i2 = types.indexOf(c2.id);

						if (i1 > i2) return 1;
						if (i1 < i2) return -1;
						return 0;
					}
				});
				break;

			case 'setOpenMenu':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: Constant.relationKey.type, condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: Constant.relationKey.setOf, condition: I.FilterCondition.In, value: [ object.type ] }
					],
					onSelect: (item: any) => {
						DataUtil.objectOpenPopup({ id: item.id, layout: I.ObjectLayout.Set });
						this.menuContext.close();
					}
				});
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			if (menuStore.isOpen(menuId)) {
				menuStore.open(menuId, param);
			} else {
				menuStore.closeAll(Constant.menuIds.featuredType, () => {
					menuStore.open(menuId, menuParam);
				});
			};
		};
	};

	onTypeSelect (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, [ Constant.relationKey.setOf ]);
		const type = dbStore.getType(object.type);

		this.menuContext.close();

		switch (item.id) {
			case 'open':
				DataUtil.objectOpenPopup({ id: object.type, layout: I.ObjectLayout.Type });
				break;

			case 'setOpen':
				DataUtil.objectOpenPopup({ id: this.setId, layout: I.ObjectLayout.Set });
				break;

			case 'setCreate':
				C.ObjectCreateSet([ object.type ], { name: type.name + ' set', iconEmoji: type.iconEmoji }, '', (message: any) => {
					if (!message.error.code) {
						DataUtil.objectOpenPopup({ id: message.objectId, layout: I.ObjectLayout.Set });
					};
				});
				break;
		};
	};

	onSource () {
		const { rootId, block, readonly } = this.props;

		if (readonly) {
			return;
		};

		menuStore.closeAll(null, () => { 
			menuStore.open('dataviewSource', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, Constant.relationKey.setOf, 0)}`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				data: {
					rootId: rootId,
					blockId: BLOCK_ID_DATAVIEW,
				}
			}); 
		});
	};

	onRelation (e: any, relationKey: string) {
		e.stopPropagation();

		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, rootId, readonly } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);

		if (readonly) {
			return;
		};

		if (relation.format == I.RelationType.Checkbox) {
			const object = detailStore.get(rootId, rootId, [ relationKey ]);
			const details = [ 
				{ key: relationKey, value: Relation.formatValue(relation, !object[relationKey], true) },
			];
			C.ObjectSetDetails(rootId, details);
			return;
		};

		const elementId = '#header';

		const param: any = {
			element: elementId,
			horizontal: I.MenuDirection.Right,
			noFlipY: true,
			noAnimation: true,
			subIds: Constant.menuIds.cell,
			onOpen: (component: any) => {
				component?.ref?.onCellClick(e, relationKey, 0);
				component?.ref?.scrollTo(relationKey, 0);
			},
			onClose: () => {
				menuStore.closeAll();
			},
			data: {
				relationKey: '',
				readonly: false,
				rootId: rootId,
			},
		};

		if (!isPopup) {
			param.fixedY = Util.sizeHeader();
			param.classNameWrap = 'fixed fromHeader';
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
	};

	elementMapper (relation: any, item: any) {
		item = Util.objectCopy(item);

		switch (relation.format) {
			case I.RelationType.File:
			case I.RelationType.Object:
				item.name = Util.shorten(item.name);
				break;

			case I.RelationType.Tag:
			case I.RelationType.Status:
				item.text = Util.shorten(item.text);
				break;
		};

		return item;
	};

	getStoreId (): string {
		const { rootId, traceId } = this.props;
		return String(rootId || '').replace('-' + traceId, '');
	};
	
});

export default BlockFeatured;