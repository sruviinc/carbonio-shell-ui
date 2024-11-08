/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DropdownItem, IconButtonProps } from '@zextras/carbonio-design-system';
import {
	Container,
	Divider,
	Dropdown,
	Icon,
	IconButton,
	Padding,
	Row,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import { debounce, isEmpty, map, noop, size } from 'lodash';
import type { SimpleInterpolation } from 'styled-components';
import styled, { css } from 'styled-components';

import { AppBoard } from './board';
import { TabsList } from './board-tab-list';
import { ResizableContainer } from './resizable-container';
import {
	BOARD_CONTAINER_ZINDEX,
	BOARD_HEADER_HEIGHT,
	BOARD_MIN_VISIBILITY,
	BOARD_TAB_WIDTH,
	HEADER_BAR_HEIGHT,
	LOCAL_STORAGE_BOARD_SIZE,
	PRIMARY_BAR_WIDTH
} from '../../constants';
import { getApp } from '../../store/app';
import {
	closeAllBoards,
	closeBoard,
	expandBoards,
	minimizeBoards,
	onGoToPanel,
	reduceBoards,
	setCurrentBoard,
	useBoardStore
} from '../../store/boards';
import { getT } from '../../store/i18n/hooks';
import type { SizeAndPosition } from '../../utils/utils';
import { setElementSizeAndPosition } from '../../utils/utils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMove } from '../hooks/useMove';
import Desktop from '../../sruvi/Desktop';
import Other from '../../sruvi/Mobile';
import Mobile from '../../sruvi/Mobile';
import VeryLarge from '../../sruvi/VeryLarge';

//////////////Mobile Code////////////////

export const BOARD_DEFAULT_POSITION_MOBILE: Pick<
	CSSProperties,
	'top' | 'left' | 'right' | 'bottom'
> = {
	right: '0',
	bottom: '0'
};
const BoardContainerCompMobile = styled.div<{ minimized: boolean }>`
	position: fixed;
	width: 100vw;
	height: 100vh;
	top: 0;
	left: 0;
	background-color: rgba(0, 0, 0, 0);
	pointer-events: none;
	z-index: ${BOARD_CONTAINER_ZINDEX};

	${({ minimized }): SimpleInterpolation =>
		minimized &&
		css`
			display: none;
		`}
`;

const BoardMobile = styled(Container)<{ expanded: boolean }>`
	z-index: 5;
	position: absolute;
	${BOARD_DEFAULT_POSITION_MOBILE};

	${({ width }): SimpleInterpolation =>
		!width &&
		css`
			/* default width and aspect ratio */

			width: 100vw;
		`}

	${({ height }): SimpleInterpolation =>
		!height &&
		css`
			height: 100vh;
		`}

	
	box-shadow: 0 0.125rem 0.3125rem 0 rgba(125, 125, 125, 0.5);
	pointer-events: auto;
	max-height: 100%;
	max-width: 100%;
	${({ expanded }): SimpleInterpolation =>
		expanded &&
		css`
			height: 100vh;
			width: calc(100% - 3rem) !important;

			min-height: 100vh;
		`};
`;

//////////////Desktop Code////////////////

export const BOARD_DEFAULT_POSITION: Pick<CSSProperties, 'top' | 'left' | 'right' | 'bottom'> = {
	right: '0',
	bottom: '0'
};

const BoardContainerComp = styled.div<{ expanded: boolean; minimized: boolean }>`
	position: fixed;
	width: calc(100vw - 200px);
	height: calc(100vh - 80px);
	top: 80px;
	left: 100px;
	right: 100px;

	background-color: transparent;
	pointer-events: none;
	z-index: ${BOARD_CONTAINER_ZINDEX};
	${({ expanded }): SimpleInterpolation =>
		expanded &&
		css`
			background-color: transparent;
			pointer-events: auto;
		`}
	${({ minimized }): SimpleInterpolation =>
		minimized &&
		css`
			display: none;
		`}
`;

const OverflowContainer = styled(Container)`
	overflow: auto;
`;

const Board = styled(Container)<{ expanded: boolean }>`
	z-index: 5;
	position: absolute;
	${BOARD_DEFAULT_POSITION};

	${({ width }): SimpleInterpolation =>
		!width &&
		css`
			/* default width and aspect ratio */
			aspect-ratio: 4 / 3;
			width: 600px;
		`}

	${({ height }): SimpleInterpolation =>
		!height &&
		css`
			/* default height */
			height: 600px;
			/* on higher screen, reduce the default height */
			@media (min-height: 800px) {
				height: 60vh;
			}
			@media (min-height: 1000px) {
				height: 50vh;
			}
		`}

	min-height: calc(${BOARD_HEADER_HEIGHT} * 3);
	min-width: calc(${BOARD_TAB_WIDTH} * 2);
	box-shadow: 0 0.125rem 0.3125rem 0 rgba(125, 125, 125, 0.5);
	pointer-events: auto;
	border-top-left-radius: 16px;
	border-top-right-radius: 16px;
	max-height: 100%;
	max-width: 100%;
	${({ expanded }): SimpleInterpolation =>
		expanded &&
		css`
			height: calc(100% - 1.5rem) !important;
			width: calc(100% - 3rem) !important;
			top: 1.5rem !important;
			left: 1.5rem !important;
			min-height: auto;
		`};
`;

const BoardHeader = styled(Row)`
	position: relative;
	padding: 0.5rem;
`;

const BoardDetailContainer = styled(Row)`
	min-height: 0;
`;
const BackButton = styled(IconButton)`
	background-color: #2196f3;
	color: #ffffff;
	:hover {
		background-color: #ffffff;
		color: #2196f3;
	}
`;
const Actions = styled(Row)``;

interface ListItemContentProps {
	icon?: string;
	label: string;
	selected?: boolean;
	app?: string;
	boardId: string;
}

function ListItemContent({
	icon,
	label,
	selected,
	app,
	boardId
}: ListItemContentProps): React.JSX.Element {
	const t = getT();
	const onClose = useCallback<IconButtonProps['onClick']>(
		(ev) => {
			ev.stopPropagation();
			closeBoard(boardId);
		},
		[boardId]
	);
	return (
		<Container orientation="horizontal" mainAlignment="flex-start" gap={'0.5rem'}>
			{icon && <Icon icon={icon} size={'large'} color={'text'} style={{ pointerEvents: 'none' }} />}
			<OverflowContainer crossAlignment={'flex-start'}>
				<Text size={'medium'} weight={selected ? 'bold' : 'regular'} color={'gray0'}>
					{label}
				</Text>
				<Text size={'small'} weight={selected ? 'bold' : 'regular'} color={'secondary'}>
					{app &&
						t('board.from_app', 'From {{app}}', {
							app
						})}
				</Text>
			</OverflowContainer>
			<IconButton icon={'CloseOutline'} size={'large'} onClick={onClose} />
		</Container>
	);
}

function calcPositionToRemainVisible(
	lastSavedPosition: number,
	containerSize: number,
	minVisibility: number
): number {
	const limit = containerSize - minVisibility;
	if (lastSavedPosition > limit) {
		return limit > 0 ? limit : 0;
	}
	return lastSavedPosition;
}

export const BoardContainer = (): React.JSX.Element | null => {
	const t = getT();
	const { boards, minimized, expanded, current, orderedBoards } = useBoardStore();

	const boardDropdownItems = useMemo(
		(): DropdownItem[] =>
			map(
				orderedBoards,
				(boardId): DropdownItem => ({
					id: boardId,
					label: boards[boardId].title,
					icon: boards[boardId].icon,
					onClick: () => setCurrentBoard(boardId),
					selected: boardId === current,
					customComponent: (
						<ListItemContent
							label={boards[boardId].title}
							icon={boards[boardId].icon}
							selected={boardId === current}
							app={getApp(boards[boardId].app)()?.display}
							boardId={boardId}
						/>
					)
				})
			),
		[boards, current, orderedBoards]
	);

	const boardRef = useRef<HTMLDivElement>(null);
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const [lastSavedBoardSizeAndPosition, setLastSavedBoardSizeAndPosition] = useLocalStorage<
		Partial<SizeAndPosition>
	>(LOCAL_STORAGE_BOARD_SIZE, {});
	const [currentBoardSizeAndPosition, setCurrentBoardSizeAndPosition] = useState(
		lastSavedBoardSizeAndPosition
	);
	const lastSavedBoardSizeAndPositionRef = useRef(lastSavedBoardSizeAndPosition);
	const [isMoving, moveElementHandler] = useMove(boardRef, {
		localStorageKey: LOCAL_STORAGE_BOARD_SIZE
	});

	const isDefaultSizeAndPosition = useMemo(
		() => size(currentBoardSizeAndPosition) === 0,
		[currentBoardSizeAndPosition]
	);
	const isBoardEmpty = useMemo(() => isEmpty(boards), [boards]);

	const resetSizeAndPosition = useCallback(() => {
		setLastSavedBoardSizeAndPosition({});
		reduceBoards();
	}, [setLastSavedBoardSizeAndPosition]);

	useEffect(() => {
		// reset position when the board is closed
		if (isBoardEmpty) {
			setLastSavedBoardSizeAndPosition((prevState) => {
				const newState = { ...prevState };
				delete newState.left;
				delete newState.top;
				return newState;
			});
		}
	}, [isBoardEmpty, setLastSavedBoardSizeAndPosition]);

	useEffect(() => {
		if (boardRef.current) {
			const boardElement = boardRef.current;
			setElementSizeAndPosition(boardElement, 'width', currentBoardSizeAndPosition.width);
			setElementSizeAndPosition(boardElement, 'height', currentBoardSizeAndPosition.height);
			setElementSizeAndPosition(boardElement, 'top', currentBoardSizeAndPosition.top);
			setElementSizeAndPosition(boardElement, 'left', currentBoardSizeAndPosition.left);
		}
	}, [currentBoardSizeAndPosition]);

	const updateBoardPosition = useMemo(
		() =>
			debounce(
				() => {
					if (
						boardContainerRef.current &&
						boardContainerRef.current.clientHeight > 0 &&
						boardContainerRef.current.clientWidth > 0
					) {
						const newSizeAndPosition: Partial<SizeAndPosition> = {};
						if (lastSavedBoardSizeAndPositionRef.current.width !== undefined) {
							newSizeAndPosition.width = lastSavedBoardSizeAndPositionRef.current.width;
						}
						if (lastSavedBoardSizeAndPositionRef.current.height !== undefined) {
							newSizeAndPosition.height = lastSavedBoardSizeAndPositionRef.current.height;
						}

						const boardContainer = boardContainerRef.current;
						if (lastSavedBoardSizeAndPositionRef.current.top !== undefined) {
							newSizeAndPosition.top = calcPositionToRemainVisible(
								lastSavedBoardSizeAndPositionRef.current.top,
								boardContainer.clientHeight,
								BOARD_MIN_VISIBILITY.top
							);
						}
						if (lastSavedBoardSizeAndPositionRef.current.left !== undefined) {
							newSizeAndPosition.left = calcPositionToRemainVisible(
								lastSavedBoardSizeAndPositionRef.current.left,
								boardContainer.clientWidth,
								BOARD_MIN_VISIBILITY.left
							);
						}
						setCurrentBoardSizeAndPosition(newSizeAndPosition);
					}
				},
				0,
				{ leading: false, trailing: true }
			),
		[]
	);

	useEffect(() => {
		window.addEventListener('resize', updateBoardPosition);
		return (): void => {
			window.removeEventListener('resize', updateBoardPosition);
		};
	}, [updateBoardPosition]);

	useEffect(() => {
		lastSavedBoardSizeAndPositionRef.current = { ...lastSavedBoardSizeAndPosition };
		// if there is a board open, then update the size and position based on the window
		if (boardRef.current) {
			if (size(lastSavedBoardSizeAndPosition) > 0) {
				updateBoardPosition();
			} else {
				setCurrentBoardSizeAndPosition({});
			}
		} else {
			// otherwise just align the current with the local storage data (refresh case, board is closed)
			setCurrentBoardSizeAndPosition({ ...lastSavedBoardSizeAndPosition });
		}

		return (): void => {
			updateBoardPosition.cancel();
		};
	}, [lastSavedBoardSizeAndPosition, updateBoardPosition]);

	const clickHandler = useCallback<
		(onClickFn: IconButtonProps['onClick']) => IconButtonProps['onClick']
	>(
		(clickFn) => (event) => {
			if (event.type !== 'click' || !event.defaultPrevented) {
				clickFn(event);
			}
		},
		[]
	);

	const boardContext = useMemo(() => current && boards[current]?.context, [boards, current]);

	return (
		(!isBoardEmpty && current && (
			<div>
				<VeryLarge>
					<BoardContainerComp expanded={expanded} minimized={minimized} ref={boardContainerRef}>
						<Board
							data-testid="NewItemContainer"
							background={'#ffffff'}
							crossAlignment="unset"
							expanded={expanded}
							ref={boardRef}
							width={currentBoardSizeAndPosition.width}
							height={currentBoardSizeAndPosition.height}
						>
							<ResizableContainer
								crossAlignment={'unset'}
								elementToResize={boardRef}
								localStorageKey={LOCAL_STORAGE_BOARD_SIZE}
								disabled={expanded}
							>
								<BoardHeader
									data-testid="BoardHeader"
									onMouseDown={(!expanded && moveElementHandler) || undefined}
								>
									<Padding all="extrasmall">
										<Tooltip
											label={t('board.hide', 'Hide board')}
											placement="top"
											disabled={isMoving}
										>
											<BackButton
												size="large"
												icon="BoardCollapseOutline"
												onClick={clickHandler(minimizeBoards)}
											/>
										</Tooltip>
									</Padding>
									<TabsList />
									<Actions padding={{ all: 'extrasmall' }}>
										{boardContext &&
											typeof boardContext === 'object' &&
											'onReturnToApp' in boardContext &&
											boardContext.onReturnToApp && (
												<Padding right="extrasmall">
													<Tooltip
														label={t('board.open_app', 'Open in app')}
														placement="top"
														disabled={isMoving}
													>
														<IconButton
															icon={'DiagonalArrowRightUp'}
															onClick={clickHandler(onGoToPanel)}
														/>
													</Tooltip>
												</Padding>
											)}
										<Container
											gap={'0.25rem'}
											orientation={'horizontal'}
											width={'fit'}
											height={'fit'}
										>
											<Tooltip
												label={t('board.show_tabs', 'Show other tabs')}
												placement="top"
												disabled={isMoving}
											>
												<Dropdown items={boardDropdownItems}>
													<IconButton icon={'ChevronDown'} onClick={clickHandler(noop)} />
												</Dropdown>
											</Tooltip>
											<Tooltip
												label={
													isDefaultSizeAndPosition
														? t(
																'board.reset_size.disabled',
																'Board already at the default position'
															)
														: t('board.reset_size.enabled', 'Return to default position and size')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={'DiagonalArrowLeftDown'}
													onClick={clickHandler(resetSizeAndPosition)}
													disabled={isDefaultSizeAndPosition}
												/>
											</Tooltip>
											<Tooltip
												label={
													expanded
														? t('board.reduce', 'Reduce board')
														: t('board.enlarge', 'Enlarge board')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={expanded ? 'CollapseOutline' : 'ExpandOutline'}
													onClick={clickHandler(expanded ? reduceBoards : expandBoards)}
												/>
											</Tooltip>
										</Container>
										<Tooltip
											label={t('board.close_tabs', 'Close all your tabs')}
											placement="top"
											disabled={isMoving}
										>
											<IconButton icon="CloseOutline" onClick={clickHandler(closeAllBoards)} />
										</Tooltip>
									</Actions>
								</BoardHeader>
								<Divider style={{ height: '0.125rem' }} />
								<BoardDetailContainer takeAvailableSpace>
									{map(boards, (b) => (
										<AppBoard key={b.id} board={b} />
									))}
								</BoardDetailContainer>
							</ResizableContainer>
						</Board>
					</BoardContainerComp>
				</VeryLarge>
				<Desktop>
					<BoardContainerComp expanded={expanded} minimized={minimized} ref={boardContainerRef}>
						<Board
							data-testid="NewItemContainer"
							background={'#ffffff'}
							crossAlignment="unset"
							expanded={expanded}
							ref={boardRef}
							width={currentBoardSizeAndPosition.width}
							height={currentBoardSizeAndPosition.height}
						>
							<ResizableContainer
								crossAlignment={'unset'}
								elementToResize={boardRef}
								localStorageKey={LOCAL_STORAGE_BOARD_SIZE}
								disabled={expanded}
							>
								<BoardHeader
									data-testid="BoardHeader"
									onMouseDown={(!expanded && moveElementHandler) || undefined}
								>
									<Padding all="extrasmall">
										<Tooltip
											label={t('board.hide', 'Hide board')}
											placement="top"
											disabled={isMoving}
										>
											<BackButton
												size="large"
												icon="BoardCollapseOutline"
												onClick={clickHandler(minimizeBoards)}
											/>
										</Tooltip>
									</Padding>
									<TabsList />
									<Actions padding={{ all: 'extrasmall' }}>
										{boardContext &&
											typeof boardContext === 'object' &&
											'onReturnToApp' in boardContext &&
											boardContext.onReturnToApp && (
												<Padding right="extrasmall">
													<Tooltip
														label={t('board.open_app', 'Open in app')}
														placement="top"
														disabled={isMoving}
													>
														<IconButton
															icon={'DiagonalArrowRightUp'}
															onClick={clickHandler(onGoToPanel)}
														/>
													</Tooltip>
												</Padding>
											)}
										<Container
											gap={'0.25rem'}
											orientation={'horizontal'}
											width={'fit'}
											height={'fit'}
										>
											<Tooltip
												label={t('board.show_tabs', 'Show other tabs')}
												placement="top"
												disabled={isMoving}
											>
												<Dropdown items={boardDropdownItems}>
													<IconButton icon={'ChevronDown'} onClick={clickHandler(noop)} />
												</Dropdown>
											</Tooltip>
											<Tooltip
												label={
													isDefaultSizeAndPosition
														? t(
																'board.reset_size.disabled',
																'Board already at the default position'
															)
														: t('board.reset_size.enabled', 'Return to default position and size')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={'DiagonalArrowLeftDown'}
													onClick={clickHandler(resetSizeAndPosition)}
													disabled={isDefaultSizeAndPosition}
												/>
											</Tooltip>
											<Tooltip
												label={
													expanded
														? t('board.reduce', 'Reduce board')
														: t('board.enlarge', 'Enlarge board')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={expanded ? 'CollapseOutline' : 'ExpandOutline'}
													onClick={clickHandler(expanded ? reduceBoards : expandBoards)}
												/>
											</Tooltip>
										</Container>
										<Tooltip
											label={t('board.close_tabs', 'Close all your tabs')}
											placement="top"
											disabled={isMoving}
										>
											<IconButton icon="CloseOutline" onClick={clickHandler(closeAllBoards)} />
										</Tooltip>
									</Actions>
								</BoardHeader>
								<Divider style={{ height: '0.125rem' }} />
								<BoardDetailContainer takeAvailableSpace>
									{map(boards, (b) => (
										<AppBoard key={b.id} board={b} />
									))}
								</BoardDetailContainer>
							</ResizableContainer>
						</Board>
					</BoardContainerComp>
				</Desktop>
				<Mobile>
					<BoardContainerCompMobile minimized={minimized} ref={boardContainerRef}>
						<BoardMobile
							data-testid="NewItemContainer"
							background={'gray6'}
							crossAlignment="unset"
							expanded={expanded}
							ref={boardRef}
							width={currentBoardSizeAndPosition.width}
							height={currentBoardSizeAndPosition.height}
						>
							<ResizableContainer
								crossAlignment={'unset'}
								elementToResize={boardRef}
								localStorageKey={LOCAL_STORAGE_BOARD_SIZE}
								disabled={expanded}
							>
								<BoardHeader
									data-testid="BoardHeader"
									background={'gray5'}
									onMouseDown={(!expanded && moveElementHandler) || undefined}
								>
									<Padding all="extrasmall">
										<Tooltip
											label={t('board.hide', 'Hide board')}
											placement="top"
											disabled={isMoving}
										>
											<BackButton
												icon="BoardCollapseOutline"
												onClick={clickHandler(minimizeBoards)}
											/>
										</Tooltip>
									</Padding>
									<TabsList />
									<Actions padding={{ all: 'extrasmall' }}>
										{boardContext &&
											typeof boardContext === 'object' &&
											'onReturnToApp' in boardContext &&
											boardContext.onReturnToApp && (
												<Padding right="extrasmall">
													<Tooltip
														label={t('board.open_app', 'Open in app')}
														placement="top"
														disabled={isMoving}
													>
														<IconButton
															icon={'DiagonalArrowRightUp'}
															onClick={clickHandler(onGoToPanel)}
														/>
													</Tooltip>
												</Padding>
											)}
										<Container
											gap={'0.25rem'}
											orientation={'horizontal'}
											width={'fit'}
											height={'fit'}
										>
											<Tooltip
												label={t('board.show_tabs', 'Show other tabs')}
												placement="top"
												disabled={isMoving}
											>
												<Dropdown items={boardDropdownItems}>
													<IconButton icon={'ChevronDown'} onClick={clickHandler(noop)} />
												</Dropdown>
											</Tooltip>
											<Tooltip
												label={
													isDefaultSizeAndPosition
														? t(
																'board.reset_size.disabled',
																'Board already at the default position'
															)
														: t('board.reset_size.enabled', 'Return to default position and size')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={'DiagonalArrowLeftDown'}
													onClick={clickHandler(resetSizeAndPosition)}
													disabled={isDefaultSizeAndPosition}
												/>
											</Tooltip>
											<Tooltip
												label={
													expanded
														? t('board.reduce', 'Reduce board')
														: t('board.enlarge', 'Enlarge board')
												}
												placement="top"
												disabled={isMoving}
											>
												<IconButton
													icon={expanded ? 'CollapseOutline' : 'ExpandOutline'}
													onClick={clickHandler(expanded ? reduceBoards : expandBoards)}
												/>
											</Tooltip>
										</Container>
										<Tooltip
											label={t('board.close_tabs', 'Close all your tabs')}
											placement="top"
											disabled={isMoving}
										>
											<IconButton icon="CloseOutline" onClick={clickHandler(closeAllBoards)} />
										</Tooltip>
									</Actions>
								</BoardHeader>
								<Divider style={{ height: '0.125rem' }} />
								<BoardDetailContainer takeAvailableSpace>
									{map(boards, (b) => (
										<AppBoard key={b.id} board={b} />
									))}
								</BoardDetailContainer>
							</ResizableContainer>
						</BoardMobile>
					</BoardContainerCompMobile>
				</Mobile>
			</div>
		)) ||
		null
	);
};
