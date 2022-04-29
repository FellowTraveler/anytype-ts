import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { blockStore, detailStore, menuStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	dataset?: any;
};

const $ = require('jquery');

const HeaderMainGraph = observer(class HeaderMainGraph extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onNavigation = this.onNavigation.bind(this);

		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { match, isPopup, rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const object = detailStore.get(breadcrumbs, rootId, [ 'templateIsBundled' ]);

		return (
			<div id="header" className="header headerMainEdit">
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="home big" tooltip="Home" onClick={this.onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={this.onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={this.onForward} />
					<Icon className="nav big" tooltip="Navigation" onClick={this.onNavigation} />
				</div>

				<div className="side center">
					<div className="path" onMouseDown={(e: any) => { this.onSearch(e); }} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
						<div className="item">
							<div className="flex">
								<IconObject object={object} size={18} />
								<div className="name">{object.name}</div>
							</div>
						</div>
					</div>
				</div>

				<div className="side right" />
			</div>
		);
	};

	componentDidMount () {
		Util.resizeSidebar();
	};

	componentDidUpdate () {
		Util.resizeSidebar();	
	};

	onHome (e: any) {
		Util.route('/main/index');
	};
	
	onBack (e: any) {
		keyboard.back();
	};
	
	onForward (e: any) {
		keyboard.forward();
	};

	onOpen () {
		const { rootId } = this.props;

		popupStore.closeAll(null, () => {
			DataUtil.objectOpen({ id: rootId, layout: I.ObjectLayout.Graph });
		});
	};

	onNavigation (e: any) {
		DataUtil.objectOpenPopup({ id: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};
	
	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		keyboard.onSearchPopup();
	};

	onPathOver () {
		const { isPopup } = this.props;
		if (isPopup) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const path = node.find('.path');

		Util.tooltipShow('Click to search', path, I.MenuDirection.Center, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide(false);
	};

});

export default HeaderMainGraph;